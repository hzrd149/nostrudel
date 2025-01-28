import { PropsWithChildren, createContext, useContext, useEffect, useMemo } from "react";
import { NostrEvent, kinds } from "nostr-tools";
import _throttle from "lodash.throttle";

import { getPubkeysFromList } from "../../helpers/nostr/lists";
import useCurrentAccount from "../../hooks/use-current-account";
import { PubkeyGraph } from "../../classes/pubkey-graph";
import replaceableEventLoader from "../../services/replaceable-loader";
import { COMMON_CONTACT_RELAYS } from "../../const";
import { eventStore } from "../../services/event-store";

export function loadSocialGraph(
  graph: PubkeyGraph,
  kind: number,
  pubkey: string,
  relay?: string,
  maxLvl = 0,
  walked: Set<string> = new Set(),
) {
  let newEvents = 0;

  const contacts = eventStore.getReplaceable(kind, pubkey);

  walked.add(pubkey);

  const handleEvent = (event: NostrEvent) => {
    graph.handleEvent(event);
    newEvents++;
    graph.throttleCompute();

    if (maxLvl > 0) {
      for (const person of getPubkeysFromList(event)) {
        if (walked.has(person.pubkey)) continue;

        loadSocialGraph(graph, kind, person.pubkey, person.relay, maxLvl - 1, walked);
      }
    }
  };

  if (contacts) {
    handleEvent(contacts);
  } else {
    replaceableEventLoader.next({
      relays: relay ? [relay, ...COMMON_CONTACT_RELAYS] : COMMON_CONTACT_RELAYS,
      kind,
      pubkey,
    });

    // wait for event to load
    const sub = eventStore.replaceable(kind, pubkey).subscribe((e) => {
      if (e) {
        handleEvent(e);
        sub.unsubscribe();
      }
    });
  }
}

const WebOfTrustContext = createContext<PubkeyGraph | null>(null);

export function useWebOfTrust() {
  return useContext(WebOfTrustContext);
}

export default function WebOfTrustProvider({ pubkey, children }: PropsWithChildren<{ pubkey?: string }>) {
  const account = useCurrentAccount();
  if (account && !pubkey) pubkey = account.pubkey;

  const graph = useMemo(() => {
    return pubkey ? new PubkeyGraph(pubkey) : null;
  }, [pubkey]);

  // load the graph when it changes
  useEffect(() => {
    if (!graph) return;

    if (import.meta.env.DEV) {
      //@ts-expect-error debug
      window.webOfTrust = graph;
    }

    loadSocialGraph(graph, kinds.Contacts, graph.root, undefined, 1);
  }, [graph]);

  return <WebOfTrustContext.Provider value={graph}>{children}</WebOfTrustContext.Provider>;
}
