import { NostrEvent } from "nostr-tools";

import CopyEmbedCodeMenuItem from "../menu/copy-embed-code";
import OpenInAppMenuItem from "../menu/open-in-app";
import QuoteEventMenuItem from "../menu/quote-event";
import DebugEventMenuItem from "../debug-modal/debug-event-menu-item";
import { DotsMenuButton, MenuIconButtonProps } from "../menu/dots-menu-button";

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
