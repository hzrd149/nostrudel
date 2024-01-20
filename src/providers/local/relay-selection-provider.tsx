import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { unique } from "../../helpers/array";

type RelaySelectionContextType = {
  relays: string[];
  setSelected: (relays: string[]) => void;
};

export const RelaySelectionContext = createContext<RelaySelectionContextType>({
  relays: [],
  setSelected: () => {},
});

export function useRelaySelectionContext() {
  return useContext(RelaySelectionContext);
}
export function useRelaySelectionRelays() {
  return useContext(RelaySelectionContext).relays;
}

export type RelaySelectionProviderProps = PropsWithChildren & {
  overrideDefault?: Iterable<string>;
  additionalDefaults?: Iterable<string>;
};

export default function RelaySelectionProvider({
  children,
  overrideDefault,
  additionalDefaults,
}: RelaySelectionProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const readRelays = useReadRelayUrls();
  const relays = useMemo(() => {
    if (location.state?.relays) return location.state.relays as string[];
    if (overrideDefault) return Array.from(overrideDefault);
    if (additionalDefaults) return unique([...readRelays, ...additionalDefaults]);
    return readRelays.urls;
  }, [location.state?.relays, overrideDefault, readRelays.urls.join("|"), additionalDefaults]);

  const setSelected = useCallback(
    (relays: string[]) => {
      navigate(location.pathname + location.search, { state: { relays }, replace: true });
    },
    [navigate, location],
  );

  const context = useMemo(
    () => ({
      relays,
      setSelected,
    }),
    [relays.join("|"), setSelected],
  );

  return <RelaySelectionContext.Provider value={context}>{children}</RelaySelectionContext.Provider>;
}
