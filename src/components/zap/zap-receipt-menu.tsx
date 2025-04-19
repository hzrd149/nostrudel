import { NostrEvent } from "nostr-tools";

import CopyEmbedCodeMenuItem from "../common-menu-items/copy-embed-code";
import OpenInAppMenuItem from "../common-menu-items/open-in-app";
import QuoteEventMenuItem from "../common-menu-items/quote-event";
import DebugEventMenuItem from "../debug-modal/debug-event-menu-item";
import { DotsMenuButton, MenuIconButtonProps } from "../dots-menu-button";

export default function ZapReceiptMenu({ zap, ...props }: { zap: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={zap} />
        <QuoteEventMenuItem event={zap} />
        <CopyEmbedCodeMenuItem event={zap} />

        <DebugEventMenuItem event={zap} />
      </DotsMenuButton>
    </>
  );
}
