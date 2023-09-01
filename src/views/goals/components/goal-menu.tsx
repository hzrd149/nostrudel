import { MenuItem, useDisclosure } from "@chakra-ui/react";
import { useCopyToClipboard } from "react-use";

import { NostrEvent } from "../../../types/nostr-event";
import { MenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import NoteDebugModal from "../../../components/debug-modals/note-debug-modal";
import { CodeIcon, ExternalLinkIcon, RepostIcon, TrashIcon } from "../../../components/icons";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { buildAppSelectUrl } from "../../../helpers/nostr/apps";
import { useDeleteEventContext } from "../../../providers/delete-event-provider";

export default function GoalMenu({ goal, ...props }: { goal: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  // const account = useCurrentAccount();
  const infoModal = useDisclosure();

  // const { deleteEvent } = useDeleteEventContext();
  const [_clipboardState, copyToClipboard] = useCopyToClipboard();

  const nevent = getSharableEventAddress(goal);

  return (
    <>
      <MenuIconButton {...props}>
        {nevent && (
          <>
            <MenuItem onClick={() => window.open(buildAppSelectUrl(nevent), "_blank")} icon={<ExternalLinkIcon />}>
              View in app...
            </MenuItem>
            <MenuItem onClick={() => copyToClipboard("nostr:" + nevent)} icon={<RepostIcon />}>
              Copy Share Link
            </MenuItem>
          </>
        )}
        {/* {account?.pubkey === goal.pubkey && (
          <MenuItem icon={<TrashIcon />} color="red.500" onClick={() => deleteEvent(goal)}>
            Delete Goal
          </MenuItem>
        )} */}
        <MenuItem onClick={infoModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
      </MenuIconButton>

      {infoModal.isOpen && (
        <NoteDebugModal event={goal} isOpen={infoModal.isOpen} onClose={infoModal.onClose} size="6xl" />
      )}
    </>
  );
}
