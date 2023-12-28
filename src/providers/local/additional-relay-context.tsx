import React, { useContext } from "react";
import { unique } from "../../helpers/array";
import { safeRelayUrl } from "../../helpers/url";

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
  const safeUrls = (extend ? [...parentRelays, ...relays] : relays).map(safeRelayUrl).filter(Boolean) as string[];

  return <RelayContext.Provider value={unique(safeUrls)}>{children}</RelayContext.Provider>;
}
