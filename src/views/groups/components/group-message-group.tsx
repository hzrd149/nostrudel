import { ButtonGroup, IconButton, Menu, MenuButton, MenuItem, MenuList, useToast } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { memo, useCallback } from "react";

import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import { CopyToClipboardIcon, ReplyIcon } from "../../../components/icons";
import DotsHorizontal from "../../../components/icons/dots-horizontal";
import DeleteEventMenuItem from "../../../components/menu/delete-event";
import MuteUserMenuItem from "../../../components/menu/mute-user";
import MessagesGroup, { MessageGroupProps } from "../../../components/message/message-group";
import AddReactionButton from "../../../components/note/timeline-note/components/add-reaction-button";
import TextNoteContents from "../../../components/note/timeline-note/text-note-contents";
import EventZapButton from "../../../components/zap/event-zap-button";

function GroupMessageActions({
  message,
  onReply,
  account,
  toast,
}: {
  message: NostrEvent;
  onReply?: (message: NostrEvent) => void;
  account: any;
  toast: any;
}) {
  const isOwnMessage = message.pubkey === account.pubkey;

  const handleReply = () => {
    onReply?.(message);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast({
        title: "Text copied to clipboard",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Failed to copy text",
        status: "error",
        duration: 2000,
      });
    }
  };

  return (
    <ButtonGroup size="sm">
      <AddReactionButton event={message} />
      <EventZapButton event={message} />
      <IconButton icon={<ReplyIcon />} aria-label="Reply" onClick={handleReply} />

      <Menu>
        <MenuButton as={IconButton} icon={<DotsHorizontal />} aria-label="More Options" />
        <MenuList>
          <MenuItem icon={<CopyToClipboardIcon />} onClick={handleCopyText}>
            Copy text
          </MenuItem>
          {!isOwnMessage && <MuteUserMenuItem event={message} />}
          {isOwnMessage && <DeleteEventMenuItem event={message} />}
          <DebugEventMenuItem event={message} />
        </MenuList>
      </Menu>
    </ButtonGroup>
  );
}

function GroupMessageGroup({
  onReply,
  messages,
  ...props
}: Omit<MessageGroupProps, "renderContent" | "messages"> & {
  messages: NostrEvent[];
  onReply?: (message: NostrEvent) => void;
}) {
  const account = useActiveAccount()!;
  const toast = useToast();

  const renderContent = useCallback((message: NostrEvent) => <TextNoteContents event={message} />, []);

  const renderActions = useCallback(
    (message: NostrEvent) => {
      return <GroupMessageActions message={message} onReply={onReply} account={account} toast={toast} />;
    },
    [account, toast, onReply],
  );

  return <MessagesGroup renderContent={renderContent} renderActions={renderActions} messages={messages} {...props} />;
}

export default memo(GroupMessageGroup);
