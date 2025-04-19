import { NostrEvent } from "nostr-tools";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/dots-menu-button";
import OpenInAppMenuItem from "../../../components/common-menu-items/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/common-menu-items/copy-embed-code";
import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";

export default function GoalMenu({ goal, ...props }: { goal: NostrEvent } & Omit<MenuIconButtonProps, "children">) {
  return (
    <>
      <DotsMenuButton {...props}>
        <OpenInAppMenuItem event={goal} />
        <CopyEmbedCodeMenuItem event={goal} />
        <DebugEventMenuItem event={goal} />
      </DotsMenuButton>
    </>
  );
}
