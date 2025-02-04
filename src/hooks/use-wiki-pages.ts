import { useEffect } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";

import { useReadRelays } from "./use-client-relays";
import wikiPageLoader from "../services/wiki-page-loader";
import { WikiPagesQuery } from "../queries/wiki-pages";

export default function useWikiPages(
  topic: string,
  additionalRelays?: Iterable<string>,
  force?: boolean,
): NostrEvent[] {
  const relays = useReadRelays(additionalRelays);

  useEffect(() => {
    wikiPageLoader.next({ value: topic, relays, force });
  }, [topic, relays.join("|"), force]);

  return useStoreQuery(WikiPagesQuery, topic ? [topic] : undefined) ?? [];
}
