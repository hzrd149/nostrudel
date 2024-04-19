import { NostrEvent } from "nostr-tools";

import { DotsMenuButton, MenuIconButtonProps } from "../../../components/dots-menu-button";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyShareLinkMenuItem from "../../../components/common-menu-items/copy-share-link";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";

export default function WikiPageMenu({
  page,
  ...props
}: { page: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={page} />
        <CopyShareLinkMenuItem event={page} />
        <CopyEmbedCodeMenuItem event={page} />

        <DebugEventMenuItem event={page} />
      </DotsMenuButton>
    </>
  );
}
