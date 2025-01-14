import { isPubkeyInList } from "../helpers/nostr/lists";
import {
  createEmptyMuteList,
  getPubkeyExpiration,
  muteListAddPubkey,
  muteListRemovePubkey,
  pruneExpiredPubkeys,
} from "../helpers/nostr/mute-list";
import { usePublishEvent } from "../providers/global/publish-provider";
import useAsyncErrorHandler from "./use-async-error-handler";
import useCurrentAccount from "./use-current-account";
import useUserMuteList from "./use-user-mute-list";

export default function useUserMuteActions(pubkey: string) {
  const account = useCurrentAccount()!;
  const publish = usePublishEvent();
  const muteList = useUserMuteList(account?.pubkey, undefined, true);

  const isMuted = isPubkeyInList(muteList, pubkey);
  const expiration = muteList ? getPubkeyExpiration(muteList, pubkey) : 0;

  const mute = useAsyncErrorHandler(async () => {
    let draft = muteListAddPubkey(muteList || createEmptyMuteList(), pubkey);
    draft = pruneExpiredPubkeys(draft);
    await publish("Mute", draft, undefined, false);
  }, [publish, muteList]);
  const unmute = useAsyncErrorHandler(async () => {
    let draft = muteListRemovePubkey(muteList || createEmptyMuteList(), pubkey);
    draft = pruneExpiredPubkeys(draft);
    await publish("Unmute", draft, undefined, false);
  }, [publish, muteList]);

  return { isMuted, expiration, mute, unmute };
}
