import React, { useContext } from "react";
import { unique } from "../../helpers/array";
import { safeRelayUrls } from "../../helpers/relay";

export const RelayContext = React.createContext<string[]>([]);

export function useAdditionalRelayContext() {
  return useContext(RelayContext) ?? [];
}

export function AdditionalRelayProvider({
  relays,
  children,
  extend = true,
}: {
  relays: string[];
  children: React.ReactNode;
  extend?: boolean;
}) {
  const parentRelays = useAdditionalRelayContext();
  const safeUrls = safeRelayUrls(extend ? [...parentRelays, ...relays] : relays);

  return <RelayContext.Provider value={unique(safeUrls)}>{children}</RelayContext.Provider>;
}
