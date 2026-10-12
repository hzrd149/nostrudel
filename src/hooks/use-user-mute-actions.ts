import { UnmuteUser } from "applesauce-actions/actions";
import { useActionRunner, useActiveAccount } from "applesauce-react/hooks";
import {
  createEmptyMuteList,
  getMuteHalf,
  getPubkeyExpiration,
  muteListAddPubkey,
  muteListRemovePubkey,
  pruneExpiredPubkeys,
} from "../helpers/nostr/mute-list";
import { usePublishEvent } from "../providers/global/publish-provider";
import useAsyncAction from "./use-async-action";
import useUserMuteList from "./use-user-mute-list";
import useUserMutes from "./use-user-mutes";

export default function useUserMuteActions(pubkey: string) {
  const account = useActiveAccount();
  const publish = usePublishEvent();
  const actions = useActionRunner();
  const muteList = useUserMuteList(account?.pubkey);
  const muted = useUserMutes(account?.pubkey);

  const isMuted = muted?.pubkeys.has(pubkey) ?? false;
  const expiration = muteList ? getPubkeyExpiration(muteList, pubkey) : 0;
  const muteHalf = getMuteHalf(muteList, pubkey);
  const canUnmute = muteHalf !== "unknown";

  const { run: mute } = useAsyncAction(async () => {
    let draft = muteListAddPubkey(muteList || createEmptyMuteList(), pubkey);
    draft = pruneExpiredPubkeys(draft);
    await publish("Mute", draft, undefined, false);
  }, [publish, muteList]);
  const { run: unmute, loading: unmuting } = useAsyncAction(async () => {
    if (muteHalf === "public") {
      let draft = muteListRemovePubkey(muteList || createEmptyMuteList(), pubkey);
      draft = pruneExpiredPubkeys(draft);
      await publish("Unmute", draft, undefined, false);
    } else if (muteHalf === "hidden") {
      await actions.exec(UnmuteUser, pubkey, true).forEach((e) => publish("Unmute", e));
    } else {
      throw new Error("Unlock your private mute list before unmuting this user");
    }
  }, [publish, muteList, muteHalf, actions, pubkey]);

  return { isMuted, expiration, mute, unmute, muteHalf, canUnmute, unmuting };
}
