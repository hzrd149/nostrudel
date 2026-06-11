import { MenuItem } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/menu/dots-menu-button";
import DeleteEventMenuItem from "../../../components/menu/delete-event";
import OpenInAppMenuItem from "../../../components/menu/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/menu/copy-embed-code";
import { isSpecialListKind } from "../../../helpers/nostr/lists";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import ClockRewind from "../../../components/icons/clock-rewind";
import { useListHistoryModalContext } from "../../../providers/route/list-history-modal-provider";

export default function ListMenu({ list, ...props }: { list: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const isSpecial = isSpecialListKind(list.kind);
  const { openModal } = useListHistoryModalContext();

  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={list} />
        <CopyEmbedCodeMenuItem event={list} />
        <MenuItem icon={<ClockRewind />} onClick={() => openModal(list)}>
          Version History
        </MenuItem>
        {!isSpecial && <DeleteEventMenuItem event={list} label="Delete List" />}
        <DebugEventMenuItem event={list} />
      </DotsMenuButton>
    </>
  );
}
