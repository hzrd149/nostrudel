import { NostrEvent } from "nostr-tools";
import { PropsWithChildren, createContext, lazy, Suspense, useCallback, useContext, useMemo, useState } from "react";
import { Spinner } from "@chakra-ui/react";

import useRouteStateValue from "../../hooks/use-route-state-value";
import { UNSAFE_DataRouterContext } from "react-router-dom";
import useRouterMarker from "../../hooks/use-router-marker";

const EventDebugModal = lazy(() => import("../../components/debug-modal"));

export const DebugModalContext = createContext({
  open: (_event: NostrEvent) => {},
});

export default function DebugModalProvider({ children }: PropsWithChildren) {
  const routeState = useRouteStateValue("debug", false);
  const { router } = useContext(UNSAFE_DataRouterContext)!;
  const marker = useRouterMarker(router);
  const [event, setEvent] = useState<NostrEvent>();

  if (routeState.value !== true) marker.reset();

  const open = useCallback(
    (event: NostrEvent) => {
      setEvent(event);
      marker.set();
      routeState.setValue(true, false);
    },
    [setEvent, marker.set, routeState.setValue],
  );
  const close = useCallback(() => {
    setEvent(undefined);
    if (marker.index.current) router.navigate(marker.index.current);
    marker.reset();
  }, [marker.reset, marker.index, router.navigate]);

  const context = useMemo(() => ({ open }), [open]);

  return (
    <DebugModalContext.Provider value={context}>
      {children}
      {routeState.value && event && (
        <Suspense fallback={<Spinner />}>
          <EventDebugModal event={event} isOpen onClose={close} />
        </Suspense>
      )}
    </DebugModalContext.Provider>
  );
}
