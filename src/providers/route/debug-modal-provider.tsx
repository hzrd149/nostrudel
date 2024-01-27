import { NostrEvent } from "nostr-tools";
import { PropsWithChildren, createContext, useCallback, useMemo, useState } from "react";

import EventDebugModal from "../../components/debug-modal/event-debug-modal";

export const DebugModalContext = createContext({
  open: (event: NostrEvent) => {},
});

export default function DebugModalProvider({ children }: PropsWithChildren) {
  const [event, setEvent] = useState<NostrEvent>();

  const open = useCallback((event: NostrEvent) => setEvent(event), [setEvent]);
  const context = useMemo(() => ({ open }), [open]);

  return (
    <DebugModalContext.Provider value={context}>
      {children}
      {event && <EventDebugModal event={event} isOpen onClose={() => setEvent(undefined)} />}
    </DebugModalContext.Provider>
  );
}
