import { PropsWithChildren, createContext, useContext, useEffect, useMemo } from "react";
import { NostrEvent, kinds } from "nostr-tools";
import _throttle from "lodash.throttle";

import { getPubkeysFromList } from "../../helpers/nostr/lists";
import useCurrentAccount from "../../hooks/use-current-account";
import { PubkeyGraph } from "../../classes/pubkey-graph";
import replaceableEventsService from "../../services/replaceable-events";
import { COMMON_CONTACT_RELAY } from "../../const";

export function loadSocialGraph(
  graph: PubkeyGraph,
  kind: number,
  pubkey: string,
  relay?: string,
  maxLvl = 0,
  walked: Set<string> = new Set(),
) {
  let newEvents = 0;

  const contacts = replaceableEventsService.requestEvent(
    relay ? [relay, COMMON_CONTACT_RELAY] : [COMMON_CONTACT_RELAY],
    kind,
    pubkey,
  );

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

  if (contacts.value) {
    handleEvent(contacts.value);
  } else {
    contacts.once((event) => handleEvent(event));
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
      //@ts-expect-error
      window.webOfTrust = graph;
    }

    loadSocialGraph(graph, kinds.Contacts, graph.root, undefined, 1);
  }, [graph]);

  return <WebOfTrustContext.Provider value={graph}>{children}</WebOfTrustContext.Provider>;
}
