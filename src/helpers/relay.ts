import { ThemeTypings } from "@chakra-ui/react";
import { Filter } from "nostr-tools";
import { SubCloser, SubscribeManyParams } from "nostr-tools/abstract-pool";
import { AbstractRelay, Subscription } from "nostr-tools/abstract-relay";
import { ConnectionState } from "rx-nostr";

// NOTE: only use this for equality checks and querying
export function getRelayVariations(relay: string) {
  if (relay.endsWith("/")) {
    return [relay.slice(0, -1), relay];
  } else return [relay, relay + "/"];
}

export function validateRelayURL(relay: string | URL) {
  if (typeof relay === "string" && relay.includes(",ws")) throw new Error("Can not have multiple relays in one string");
  const url = typeof relay === "string" ? new URL(relay) : relay;
  if (url.protocol !== "wss:" && url.protocol !== "ws:") throw new Error("Incorrect protocol");
  return url;
}
export function isValidRelayURL(relay: string | URL) {
  try {
    validateRelayURL(relay);
    return true;
  } catch (e) {
    return false;
  }
}

/** @deprecated */
export function normalizeRelayURL(relayUrl: string) {
  const url = validateRelayURL(relayUrl);
  url.pathname = url.pathname.replace(/\/+/g, "/");
  if ((url.port === "80" && url.protocol === "ws:") || (url.port === "443" && url.protocol === "wss:")) url.port = "";
  url.searchParams.sort();
  url.hash = "";
  return url.toString();
}

/** @deprecated */
export function safeNormalizeRelayURL(relayUrl: string) {
  try {
    return normalizeRelayURL(relayUrl);
  } catch (e) {
    return null;
  }
}

// TODO: move these to helpers/relay
export function safeRelayUrl(relayUrl: string | URL) {
  try {
    return validateRelayURL(relayUrl).toString();
  } catch (e) {
    return null;
  }
}
export function safeRelayUrls(urls: Iterable<string>): string[] {
  return Array.from(urls).map(safeRelayUrl).filter(Boolean) as string[];
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

// copied from nostr-tools, SimplePool#subscribeMany
export function subscribeMany(relays: string[], filters: Filter[], params: SubscribeManyParams): SubCloser {
  const _knownIds = new Set<string>();
  const subs: Subscription[] = [];

  // batch all EOSEs into a single
  const eosesReceived: boolean[] = [];
  let handleEose = (i: number) => {
    eosesReceived[i] = true;
    if (eosesReceived.filter((a) => a).length === relays.length) {
      params.oneose?.();
      handleEose = () => {};
    }
  };
  // batch all closes into a single
  const closesReceived: string[] = [];
  let handleClose = (i: number, reason: string) => {
    handleEose(i);
    closesReceived[i] = reason;
    if (closesReceived.filter((a) => a).length === relays.length) {
      params.onclose?.(closesReceived);
      handleClose = () => {};
    }
  };

  const localAlreadyHaveEventHandler = (id: string) => {
    if (params.alreadyHaveEvent?.(id)) {
      return true;
    }
    const have = _knownIds.has(id);
    _knownIds.add(id);
    return have;
  };

  // open a subscription in all given relays
  const allOpened = Promise.all(
    relays.map(validateRelayURL).map(async (url, i, arr) => {
      if (arr.indexOf(url) !== i) {
        // duplicate
        handleClose(i, "duplicate url");
        return;
      }

      let relay: AbstractRelay;
      try {
        const { default: relayPoolService } = await import("../services/relay-pool");
        relay = relayPoolService.requestRelay(url);
        await relayPoolService.requestConnect(relay);
        // changed from nostr-tools
        // relay = await this.ensureRelay(url, {
        //   connectionTimeout: params.maxWait ? Math.max(params.maxWait * 0.8, params.maxWait - 1000) : undefined,
        // });
      } catch (err) {
        handleClose(i, (err as any)?.message || String(err));
        return;
      }

      const subscription = relay.subscribe(filters, {
        ...params,
        oneose: () => handleEose(i),
        onclose: (reason) => handleClose(i, reason),
        alreadyHaveEvent: localAlreadyHaveEventHandler,
        eoseTimeout: params.maxWait,
      });

      subs.push(subscription);
    }),
  );

  return {
    async close() {
      await allOpened;
      subs.forEach((sub) => {
        sub.close();
      });
    },
  };
}

export function getConnectionStateColor(state: ConnectionState): ThemeTypings["colorSchemes"] {
  switch (state) {
    case "initialized":
    case "connecting":
      return "blue";

    case "connected":
      return "green";

    case "rejected":
    case "error":
      return "red";

    case "waiting-for-retrying":
      return "orange";

    case "retrying":
      return "yellow";

    default:
    case "dormant":
    case "terminated":
      return "gray";
  }
}

const connectionStateSortOrder: ConnectionState[] = [
  "connected",
  "connecting",
  "retrying",
  "waiting-for-retrying",
  "error",
  "rejected",
  "initialized",
  "dormant",
  "terminated",
];
export function getConnectionStateSort(state: ConnectionState) {
  return connectionStateSortOrder.indexOf(state);
}

/** @deprecated use mergeRelaySets from applesauce-core */
export function mergeRelaySets(...sources: (Iterable<string> | undefined)[]) {
  const set = new Set<string>();
  for (const src of sources) {
    if (!src) continue;
    for (const url of src) {
      const safe = safeRelayUrl(url);
      if (safe) set.add(safe);
    }
  }
  return Array.from(set);
}
