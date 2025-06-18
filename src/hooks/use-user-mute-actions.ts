import { useActiveAccount } from "applesauce-react/hooks";
import { isPubkeyInList } from "../helpers/nostr/lists";
import {
  createEmptyMuteList,
  getPubkeyExpiration,
  muteListAddPubkey,
  muteListRemovePubkey,
  pruneExpiredPubkeys,
} from "../helpers/nostr/mute-list";
import { usePublishEvent } from "../providers/global/publish-provider";
import useAsyncAction from "./use-async-action";
import useUserMuteList from "./use-user-mute-list";

export default function useUserMuteActions(pubkey: string) {
  const account = useActiveAccount();
  const publish = usePublishEvent();
  const muteList = useUserMuteList(account?.pubkey);

  const isMuted = isPubkeyInList(muteList, pubkey);
  const expiration = muteList ? getPubkeyExpiration(muteList, pubkey) : 0;

  const { run: mute } = useAsyncAction(async () => {
    let draft = muteListAddPubkey(muteList || createEmptyMuteList(), pubkey);
    draft = pruneExpiredPubkeys(draft);
    await publish("Mute", draft, undefined, false);
  }, [publish, muteList]);
  const { run: unmute } = useAsyncAction(async () => {
    let draft = muteListRemovePubkey(muteList || createEmptyMuteList(), pubkey);
    draft = pruneExpiredPubkeys(draft);
    await publish("Unmute", draft, undefined, false);
  }, [publish, muteList]);

  return { isMuted, expiration, mute, unmute };
}
