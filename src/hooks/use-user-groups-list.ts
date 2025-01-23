import { getPublicGroups } from "applesauce-lists/helpers/groups";

import useCurrentAccount from "./use-current-account";
import useReplaceableEvent from "./use-replaceable-event";
import { USER_GROUPS_LIST_KIND } from "../helpers/nostr/lists";

export default function useUserGroupsList(pubkey?: string, relays: string[] = [], force?: boolean) {
  const account = useCurrentAccount();
  const key = pubkey ?? account?.pubkey;

  const list = useReplaceableEvent(key ? { kind: USER_GROUPS_LIST_KIND, pubkey: key } : undefined, relays, force);
  const pointers = list ? getPublicGroups(list) : [];

  return { list, pointers };
}
