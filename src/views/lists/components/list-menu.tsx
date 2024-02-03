import { Image, MenuItem } from "@chakra-ui/react";

import { NostrEvent, isPTag } from "../../../types/nostr-event";
import { CustomMenuIconButton, MenuIconButtonProps } from "../../../components/menu-icon-button";
import { getSharableEventAddress } from "../../../helpers/nip19";
import DeleteEventMenuItem from "../../../components/common-menu-items/delete-event";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import { isSpecialListKind } from "../../../helpers/nostr/lists";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";

export default function ListMenu({ list, ...props }: { list: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const naddr = getSharableEventAddress(list);
  const isSpecial = isSpecialListKind(list.kind);

  const hasPeople = list.tags.some(isPTag);

  return (
    <>
      <CustomMenuIconButton {...props}>
        <OpenInAppMenuItem event={list} />
        <CopyEmbedCodeMenuItem event={list} />
        {!isSpecial && <DeleteEventMenuItem event={list} label="Delete List" />}
        {hasPeople && (
          <MenuItem
            icon={<Image w="4" h="4" src="https://www.makeprisms.com/favicon.ico" />}
            onClick={() => window.open(`https://www.makeprisms.com/create/${naddr}`, "_blank")}
          >
            Create $prism
          </MenuItem>
        )}
        <DebugEventMenuItem event={list} />
      </CustomMenuIconButton>
    </>
  );
}
