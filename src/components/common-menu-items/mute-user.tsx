import { MenuItem } from "@chakra-ui/react";
import { UnmuteUser } from "applesauce-actions/actions";
import { useActionHub, useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";

import useAsyncAction from "../../hooks/use-async-action";
import useUserMuteActions from "../../hooks/use-user-mute-actions";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { useMuteModalContext } from "../../providers/route/mute-modal-provider";
import { MuteIcon, UnmuteIcon } from "../icons";

export default function MuteUserMenuItem({ event }: { event: NostrEvent }) {
  const account = useActiveAccount();
  const { isMuted } = useUserMuteActions(event.pubkey);
  const { openModal } = useMuteModalContext();
  const actions = useActionHub();
  const publish = usePublishEvent();

  if (account?.pubkey === event.pubkey) return null;

  const unmute = useAsyncAction(async () => {
    await actions.exec(UnmuteUser, event.pubkey).forEach((e) => publish("Unmute", e));
  });

  return (
    <MenuItem
      onClick={isMuted ? unmute.run : () => openModal(event.pubkey)}
      isDisabled={unmute.loading}
      icon={isMuted ? <UnmuteIcon /> : <MuteIcon />}
      color="red.500"
    >
      {isMuted ? "Unmute User" : "Mute User"}
    </MenuItem>
  );
}
