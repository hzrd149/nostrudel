import { useActiveAccount } from "applesauce-react/hooks";
import useReplaceableEvent from "./use-replaceable-event";
import { PODCASTS_LIST_KIND } from "../helpers/nostr/podcasts";

export default function useUserPodcasts(pubkey?: string, additionalRelays?: Iterable<string>, force?: boolean) {
  const account = useActiveAccount();
  pubkey = pubkey || account?.pubkey;

  return useReplaceableEvent(pubkey ? { kind: PODCASTS_LIST_KIND, pubkey } : undefined, additionalRelays, force);
}
