import { ButtonGroup, IconButton, Menu, MenuButton, MenuItem, MenuList, useToast } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { memo, useCallback } from "react";

import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import { CopyToClipboardIcon } from "../../../components/icons";
import DotsHorizontal from "../../../components/icons/dots-horizontal";
import DeleteEventMenuItem from "../../../components/menu/delete-event";
import MessagesGroup, { MessageGroupProps } from "../../../components/message/message-group";
import AddReactionButton from "../../../components/note/timeline-note/components/add-reaction-button";
import EventZapButton from "../../../components/zap/event-zap-button";
import ChannelMessageContent from "./channel-message-content";

function ChannelMessageActions({ message }: { message: NostrEvent }) {
  const toast = useToast();

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast({
        title: "Text copied to clipboard",
        status: "success",
      });
    } catch (error) {
      toast({
        title: "Failed to copy text",
        status: "error",
      });
    }
  };

  return (
    <ButtonGroup size="xs" variant="ghost" gap="0">
      <AddReactionButton event={message} size="xs" />
      <EventZapButton event={message} size="xs" />
      <Menu>
        <MenuButton as={IconButton} aria-label="More actions" icon={<DotsHorizontal />} size="xs" />
        <MenuList fontSize="sm">
          <MenuItem onClick={handleCopyText} icon={<CopyToClipboardIcon />}>
            Copy text
          </MenuItem>
          <DeleteEventMenuItem event={message} />
          <DebugEventMenuItem event={message} />
        </MenuList>
      </Menu>
    </ButtonGroup>
  );
}

function ChannelMessageBlock(props: Omit<MessageGroupProps, "renderContent">) {
  const account = useActiveAccount()!;
  const toast = useToast();

  const renderContent = useCallback((message: NostrEvent) => <ChannelMessageContent message={message} />, []);

  const renderActions = useCallback(
    (message: NostrEvent) => {
      return <ChannelMessageActions message={message} />;
    },
    [account, toast],
  );

  return <MessagesGroup renderContent={renderContent} renderActions={renderActions} {...props} />;
}

export default memo(ChannelMessageBlock);
