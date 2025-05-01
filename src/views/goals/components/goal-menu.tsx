import { NostrEvent } from "nostr-tools";
import { DotsMenuButton, MenuIconButtonProps } from "../../../components/menu/dots-menu-button";
import OpenInAppMenuItem from "../../../components/menu/open-in-app";
import CopyEmbedCodeMenuItem from "../../../components/menu/copy-embed-code";
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
