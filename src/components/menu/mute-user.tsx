import { MenuItem } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";

import useUserMuteActions from "../../hooks/use-user-mute-actions";
import { useMuteModalContext } from "../../providers/route/mute-modal-provider";
import { MuteIcon, UnmuteIcon } from "../icons";

export default function MuteUserMenuItem({ event }: { event: NostrEvent }) {
  const account = useActiveAccount();
  const { isMuted, unmute, canUnmute, unmuting } = useUserMuteActions(event.pubkey);
  const { openModal } = useMuteModalContext();

  if (account?.pubkey === event.pubkey) return null;

  const disabled = isMuted ? unmuting || !canUnmute : false;

  return (
    <MenuItem
      onClick={isMuted ? unmute : () => openModal(event.pubkey)}
      isDisabled={disabled}
      icon={isMuted ? <UnmuteIcon /> : <MuteIcon />}
      color="red.500"
      title={isMuted && !canUnmute ? "Unlock your private mute list to unmute this user" : undefined}
    >
      {isMuted ? "Unmute User" : "Mute User"}
    </MenuItem>
  );
}
