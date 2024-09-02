import { Image, MenuItem } from "@chakra-ui/react";

import { NostrEvent, isPTag } from "../../../types/nostr-event";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/dots-menu-button";
import DeleteEventMenuItem from "../../../components/common-menu-items/delete-event";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import { isSpecialListKind } from "../../../helpers/nostr/lists";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";

export default function ListMenu({ list, ...props }: { list: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const address = useShareableEventAddress(list);
  const isSpecial = isSpecialListKind(list.kind);

  const hasPeople = list.tags.some(isPTag);

  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={list} />
        <CopyEmbedCodeMenuItem event={list} />
        {!isSpecial && <DeleteEventMenuItem event={list} label="Delete List" />}
        {hasPeople && (
          <MenuItem
            icon={<Image w="4" h="4" src="https://framerusercontent.com/images/3S3Pyvkh2tEvvKyX47QrUq7XQLk.png" />}
            onClick={() => window.open(`https://www.makeprisms.com/create/${address}`, "_blank")}
          >
            Create $prism
          </MenuItem>
        )}
        <DebugEventMenuItem event={list} />
      </DotsMenuButton>
    </>
  );
}
