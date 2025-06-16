import { NostrEvent } from "nostr-tools";
import { useEffect } from "react";
import { useEventModel } from "applesauce-react/hooks";

import { WikiPagesModel } from "../models/wiki-pages";
import wikiPageLoader from "../services/wiki-page-loader";
import { useReadRelays } from "./use-client-relays";

export default function useWikiPages(
  topic: string,
  additionalRelays?: Iterable<string>,
  force?: boolean,
): NostrEvent[] {
  const relays = useReadRelays(additionalRelays);

  useEffect(() => {
    wikiPageLoader({ value: topic, relays, force }).subscribe();
  }, [topic, relays.join("|"), force]);

  return useEventModel(WikiPagesModel, topic ? [topic] : undefined) ?? [];
}
