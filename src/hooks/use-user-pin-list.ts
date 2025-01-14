import { kinds } from "nostr-tools";
import { getPointersFromList } from "../helpers/nostr/lists";
import useCurrentAccount from "./use-current-account";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUserPinList(pubkey?: string, relays: string[] = [], force?: boolean) {
  const account = useCurrentAccount();
  const key = pubkey ?? account?.pubkey;

  const list = useReplaceableEvent(key ? { kind: kinds.Pinlist, pubkey: key } : undefined, relays, force);

  const pointers = list ? getPointersFromList(list) : [];

  return { list, pointers };
}
