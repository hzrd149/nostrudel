import { MenuItem, useDisclosure, useToast } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";

import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import { NostrEvent } from "../../../types/nostr-event";
import { CodeIcon, CopyToClipboardIcon } from "../../../components/icons";
import CommunityPostDebugModal from "../../../components/debug-modals/community-post-debug-modal";
import CopyShareLinkMenuItem from "../../../components/common-menu-items/copy-share-link";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import DeleteEventMenuItem from "../../../components/common-menu-items/delete-event";

export default function CommunityPostMenu({
  event,
  approvals,
  ...props
}: Omit<MenuIconButtonProps, "children"> & { event: NostrEvent; approvals: NostrEvent[] }) {
  const toast = useToast();
  const debugModal = useDisclosure();

  return (
    <>
      <CustomMenuIconButton {...props}>
        <OpenInAppMenuItem event={event} />
        <CopyShareLinkMenuItem event={event} />
        <MenuItem
          onClick={() => {
            const text = nip19.noteEncode(event.id);
            if (navigator.clipboard) navigator.clipboard.writeText(text);
            else toast({ description: text, isClosable: true, duration: null });
          }}
          icon={<CopyToClipboardIcon />}
        >
          Copy Note ID
        </MenuItem>
        <DeleteEventMenuItem event={event} label="Delete Post" />
        <MenuItem onClick={debugModal.onOpen} icon={<CodeIcon />}>
          View Raw
        </MenuItem>
      </CustomMenuIconButton>

      {debugModal.isOpen && (
        <CommunityPostDebugModal
          event={event}
          isOpen={debugModal.isOpen}
          onClose={debugModal.onClose}
          size="6xl"
          approvals={approvals}
        />
      )}
    </>
  );
}
