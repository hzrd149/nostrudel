import { NostrEvent } from "nostr-tools";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/menu/dots-menu-button";
import DeleteEventMenuItem from "../../../components/menu/delete-event";
import OpenInAppMenuItem from "../../../components/menu/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/menu/copy-embed-code";
import { isSpecialListKind } from "../../../helpers/nostr/lists";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";

export default function ListMenu({ list, ...props }: { list: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  const isSpecial = isSpecialListKind(list.kind);

  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={list} />
        <CopyEmbedCodeMenuItem event={list} />
        {!isSpecial && <DeleteEventMenuItem event={list} label="Delete List" />}
        <DebugEventMenuItem event={list} />
      </DotsMenuButton>
    </>
  );
}
