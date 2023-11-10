import { COMMUNITY_DEFINITION_KIND, SUBSCRIBED_COMMUNITIES_LIST_IDENTIFIER } from "../helpers/nostr/communities";
import { NOTE_LIST_KIND, getParsedCordsFromList } from "../helpers/nostr/lists";
import { RequestOptions } from "../services/replaceable-event-requester";
import useCurrentAccount from "./use-current-account";
import useReplaceableEvent from "./use-replaceable-event";

export default function useJoinedCommunitiesList(pubkey?: string, opts?: RequestOptions) {
  const account = useCurrentAccount();
  const key = pubkey ?? account?.pubkey;

  const list = useReplaceableEvent(
    key
      ? {
          kind: NOTE_LIST_KIND,
          identifier: SUBSCRIBED_COMMUNITIES_LIST_IDENTIFIER,
          pubkey: key,
        }
      : undefined,
    [],
    opts,
  );

  const pointers = list ? getParsedCordsFromList(list).filter((cord) => cord.kind === COMMUNITY_DEFINITION_KIND) : [];

  return {
    list,
    pointers,
  };
}
