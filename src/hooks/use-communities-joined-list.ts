import { COMMUNITY_DEFINITION_KIND, SUBSCRIBED_COMMUNITIES_LIST_IDENTIFIER } from "../helpers/nostr/communities";
import { COMMUNITIES_LIST_KIND, NOTE_LIST_KIND, getParsedCordsFromList } from "../helpers/nostr/lists";
import { RequestOptions } from "../services/replaceable-event-requester";
import useCurrentAccount from "./use-current-account";
import useReplaceableEvent from "./use-replaceable-event";

export default function useJoinedCommunitiesList(pubkey?: string, opts?: RequestOptions) {
  const account = useCurrentAccount();
  const key = pubkey ?? account?.pubkey;

  // TODO: remove at some future date when apps have transitioned to using k:10004 for communities
  // https://github.com/nostr-protocol/nips/pull/880
  /** @deprecated */
  const oldList = useReplaceableEvent(
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
  const list = useReplaceableEvent(key ? { kind: COMMUNITIES_LIST_KIND, pubkey: key } : undefined, [], opts);

  let useList = list || oldList;
  console.log(list, oldList);

  // if both exist, use the newest one
  if (list && oldList) {
    useList = list.created_at > oldList.created_at ? list : oldList;
  }

  const pointers = useList
    ? getParsedCordsFromList(useList).filter((cord) => cord.kind === COMMUNITY_DEFINITION_KIND)
    : [];

  return { list: useList, pointers };
}
