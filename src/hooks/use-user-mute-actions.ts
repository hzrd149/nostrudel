import { MuteUser, UnmuteUser } from "applesauce-actions/actions";
import { useActionRunner, useActiveAccount } from "applesauce-react/hooks";
import { getMuteHalf } from "../helpers/nostr/mute-list";
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
  const muteHalf = getMuteHalf(muteList, pubkey);
  const canUnmute = muteHalf !== "unknown";

  const { run: mute, loading: muting } = useAsyncAction(
    async (hidden = false) => {
      await actions.exec(MuteUser, pubkey, hidden).forEach((e) => publish("Mute", e));
      return true;
    },
    [publish, actions, pubkey],
  );
  const { run: unmute, loading: unmuting } = useAsyncAction(async () => {
    if (muteHalf !== "unknown") {
      await actions.exec(UnmuteUser, pubkey, muteHalf === "hidden").forEach((e) => publish("Unmute", e));
    } else {
      throw new Error("Unlock your private mute list before unmuting this user");
    }
  }, [publish, muteList, muteHalf, actions, pubkey]);

  return { isMuted, mute, muting, unmute, muteHalf, canUnmute, unmuting };
}
