import { ThemeTypings } from "@chakra-ui/react";
import { Filter } from "nostr-tools";
import { ConnectionState } from "../services/pool";

// NOTE: only use this for equality checks and querying
export function getRelayVariations(relay: string) {
  if (relay.endsWith("/")) {
    return [relay.slice(0, -1), relay];
  } else return [relay, relay + "/"];
}

export function splitNostrFilterByPubkeys(
  filter: Filter | Filter[],
  relayPubkeyMap: Record<string, string[]>,
): Record<string, Filter | Filter[]> {
  if (Array.isArray(filter)) {
    const dir: Record<string, Filter[]> = {};

    for (const query of filter) {
      const split = splitQueryByPubkeys(query, relayPubkeyMap);
      for (const [relay, splitQuery] of Object.entries(split)) {
        dir[relay] = dir[relay] || [];
        dir[relay].push(splitQuery);
      }
    }

    return dir;
  } else return splitQueryByPubkeys(filter, relayPubkeyMap);
}

export function splitQueryByPubkeys(query: Filter, relayPubkeyMap: Record<string, string[]>) {
  const filtersByRelay: Record<string, Filter> = {};

  const allPubkeys = new Set(Object.values(relayPubkeyMap).flat());
  for (const [relay, pubkeys] of Object.entries(relayPubkeyMap)) {
    if (query.authors || query["#p"]) {
      filtersByRelay[relay] = {
        ...query,
        ...filtersByRelay[relay],
      };

      if (query.authors)
        filtersByRelay[relay].authors = query.authors.filter((p) => !allPubkeys.has(p)).concat(pubkeys);
      if (query["#p"]) filtersByRelay[relay]["#p"] = query["#p"].filter((p) => !allPubkeys.has(p)).concat(pubkeys);
    } else filtersByRelay[relay] = query;
  }

  return filtersByRelay;
}

export function getConnectionStateColor(state: ConnectionState): ThemeTypings["colorSchemes"] {
  switch (state) {
    case "connecting":
      return "blue";

    case "connected":
      return "green";

    case "error":
      return "red";

    case "retrying":
      return "yellow";

    default:
    case "dormant":
      return "gray";
  }
}

const connectionStateSortOrder: ConnectionState[] = ["connected", "connecting", "retrying", "error", "dormant"];
export function getConnectionStateSort(state: ConnectionState) {
  return connectionStateSortOrder.indexOf(state);
}
