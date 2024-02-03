import { MenuItem } from "@chakra-ui/react";

import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import { NostrEvent } from "../../../types/nostr-event";
import useCurrentAccount from "../../../hooks/use-current-account";
import PencilLine from "../../../components/icons/pencil-line";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";

export default function CommunityMenu({
  community,
  onEditClick,
  ...props
}: Omit<MenuIconButtonProps, "children"> & { community: NostrEvent; onEditClick?: () => void }) {
  const account = useCurrentAccount();

  return (
    <>
      <CustomMenuIconButton {...props}>
        <OpenInAppMenuItem event={community} />
        <CopyEmbedCodeMenuItem event={community} />
        {account?.pubkey === community.pubkey && onEditClick && (
          <MenuItem onClick={onEditClick} icon={<PencilLine />}>
            Edit Community
          </MenuItem>
        )}
        <DebugEventMenuItem event={community} />
      </CustomMenuIconButton>
    </>
  );
}
