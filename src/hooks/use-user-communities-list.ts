import { kinds } from "nostr-tools";

import { SUBSCRIBED_COMMUNITIES_LIST_IDENTIFIER } from "../helpers/nostr/communities";
import { getAddressPointersFromList } from "../helpers/nostr/lists";
import { RequestOptions } from "../services/replaceable-events";
import useCurrentAccount from "./use-current-account";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUserCommunitiesList(pubkey?: string, relays?: Iterable<string>, opts?: RequestOptions) {
  const account = useCurrentAccount();
  const key = pubkey ?? account?.pubkey;

  // TODO: remove at some future date when apps have transitioned to using k:10004 for communities
  // https://github.com/nostr-protocol/nips/pull/880
  /** @deprecated */
  const oldList = useReplaceableEvent(
    key
      ? {
          kind: kinds.Genericlists,
          identifier: SUBSCRIBED_COMMUNITIES_LIST_IDENTIFIER,
          pubkey: key,
        }
      : undefined,
    [],
    opts,
  );
  const list = useReplaceableEvent(key ? { kind: kinds.CommunitiesList, pubkey: key } : undefined, relays, opts);

  let useList = list || oldList;

  // if both exist, use the newest one
  if (list && oldList) {
    useList = list.created_at > oldList.created_at ? list : oldList;
  }

  const pointers = useList
    ? getAddressPointersFromList(useList).filter((cord) => cord.kind === kinds.CommunityDefinition)
    : [];

  return { list: useList, pointers };
}
