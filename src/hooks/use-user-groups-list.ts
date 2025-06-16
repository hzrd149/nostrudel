import { getPublicGroups } from "applesauce-core/helpers/groups";
import { useActiveAccount } from "applesauce-react/hooks";

import useReplaceableEvent from "./use-replaceable-event";
import { USER_GROUPS_LIST_KIND } from "../helpers/nostr/lists";

export default function useUserGroupsList(pubkey?: string, relays?: string[]) {
  const account = useActiveAccount();
  const key = pubkey ?? account?.pubkey;

  const list = useReplaceableEvent(key ? { kind: USER_GROUPS_LIST_KIND, pubkey: key, relays } : undefined);
  const pointers = list ? getPublicGroups(list) : [];

  return { list, pointers };
}
