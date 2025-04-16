import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { PropsWithChildren, createContext, useContext, useEffect, useMemo } from "react";

import { PubkeyGraph } from "../../classes/pubkey-graph";
import { DEFAULT_LOOKUP_RELAYS } from "../../const";
import { getPubkeysFromList } from "../../helpers/nostr/lists";
import { eventStore } from "../../services/event-store";
import replaceableEventLoader from "../../services/replaceable-loader";

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
      relays: relay ? [relay, ...DEFAULT_LOOKUP_RELAYS] : DEFAULT_LOOKUP_RELAYS,
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
  const account = useActiveAccount();
  if (account && !pubkey) pubkey = account.pubkey;

  const graph = useMemo(() => {
    return pubkey ? new PubkeyGraph(pubkey) : null;
  }, [pubkey]);

  // load the graph when it changes
  useEffect(() => {
    if (!graph) return;
    // loadSocialGraph(graph, kinds.Contacts, graph.root, undefined, 1);
  }, [graph]);

  return <WebOfTrustContext.Provider value={graph}>{children}</WebOfTrustContext.Provider>;
}
