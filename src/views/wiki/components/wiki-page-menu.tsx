import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";
import { MenuItem } from "@chakra-ui/react";

import { DotsMenuButton, MenuIconButtonProps } from "../../../components/dots-menu-button";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import ShareLinkMenuItem from "../../../components/common-menu-items/share-link";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import useCurrentAccount from "../../../hooks/use-current-account";
import { EditIcon } from "../../../components/icons";
import { getPageTopic } from "../../../helpers/nostr/wiki";

export default function WikiPageMenu({ page, ...props }: { page: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const account = useCurrentAccount();

  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={page} />
        {account?.pubkey === page.pubkey && (
          <MenuItem as={RouterLink} to={`/wiki/edit/${getPageTopic(page)}`} icon={<EditIcon />}>
            Edit Page
          </MenuItem>
        )}

        <ShareLinkMenuItem event={page} />
        <CopyEmbedCodeMenuItem event={page} />

        <DebugEventMenuItem event={page} />
      </DotsMenuButton>
    </>
  );
}
