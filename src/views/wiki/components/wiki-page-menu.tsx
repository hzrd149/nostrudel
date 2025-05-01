import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";
import { MenuItem } from "@chakra-ui/react";

import { DotsMenuButton, MenuIconButtonProps } from "../../../components/menu/dots-menu-button";
import OpenInAppMenuItem from "../../../components/menu/open-in-app";
import ShareLinkMenuItem from "../../../components/menu/share-link";
import CopyEmbedCodeMenuItem from "../../../components/menu/copy-embed-code";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import { useActiveAccount } from "applesauce-react/hooks";
import { EditIcon } from "../../../components/icons";
import { getPageTopic } from "../../../helpers/nostr/wiki";
import GitBranch02 from "../../../components/icons/git-branch-02";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import DeleteEventMenuItem from "../../../components/menu/delete-event";

export default function WikiPageMenu({ page, ...props }: { page: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const account = useActiveAccount();
  const address = useShareableEventAddress(page);

  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={page} />
        {account?.pubkey === page.pubkey && (
          <MenuItem as={RouterLink} to={`/wiki/edit/${getPageTopic(page)}`} icon={<EditIcon />}>
            Edit Page
          </MenuItem>
        )}
        {account?.pubkey !== page.pubkey && (
          <MenuItem as={RouterLink} to={`/wiki/create?fork=${address}`} icon={<GitBranch02 />}>
            Fork Page
          </MenuItem>
        )}

        <DeleteEventMenuItem event={page} label="Delete Page" />

        <ShareLinkMenuItem event={page} />
        <CopyEmbedCodeMenuItem event={page} />

        <DebugEventMenuItem event={page} />
      </DotsMenuButton>
    </>
  );
}
