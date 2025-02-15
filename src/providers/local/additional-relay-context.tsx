import React, { useContext } from "react";
import { unique } from "../../helpers/array";
import { mergeRelaySets } from "applesauce-core/helpers";

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
  const safeUrls = extend ? mergeRelaySets(parentRelays, relays) : relays;

  return <RelayContext.Provider value={unique(safeUrls)}>{children}</RelayContext.Provider>;
}
