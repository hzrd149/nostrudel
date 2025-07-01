import { ButtonGroup, IconButton, Menu, MenuButton, MenuItem, MenuList, useToast } from "@chakra-ui/react";
import { Rumor } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { memo, useCallback } from "react";

import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import { CopyToClipboardIcon, ReplyIcon } from "../../../components/icons";
import DotsHorizontal from "../../../components/icons/dots-horizontal";
import DeleteEventMenuItem from "../../../components/menu/delete-event";
import MessagesGroup, { MessageGroupProps } from "../../../components/message/message-group";
import AddReactionButton from "../../../components/note/timeline-note/components/add-reaction-button";
import EventZapButton from "../../../components/zap/event-zap-button";
import { useLegacyMessagePlaintext } from "../../../hooks/use-legacy-message-plaintext";
import DirectMessageContent from "./direct-message-content";

function DirectMessageActions({
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
  const { plaintext } = useLegacyMessagePlaintext(message);
  const isOwnMessage = message.pubkey === account.pubkey;
  const canDelete = isOwnMessage && message.kind === kinds.EncryptedDirectMessage;

  const handleReply = () => {
    onReply?.(message);
  };

  const handleCopyText = async () => {
    if (plaintext) {
      try {
        await navigator.clipboard.writeText(plaintext);
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
    }
  };

  return (
    <ButtonGroup size="xs" variant="ghost" gap="0">
      <IconButton aria-label="Reply" icon={<ReplyIcon />} onClick={handleReply} size="xs" />
      <AddReactionButton event={message} size="xs" />
      <EventZapButton event={message} size="xs" />
      <Menu>
        <MenuButton as={IconButton} aria-label="More actions" icon={<DotsHorizontal />} size="xs" />
        <MenuList fontSize="sm">
          <MenuItem icon={<CopyToClipboardIcon />} onClick={handleCopyText}>
            Copy text
          </MenuItem>
          {canDelete && <DeleteEventMenuItem event={message} />}
          <DebugEventMenuItem event={message} />
        </MenuList>
      </Menu>
    </ButtonGroup>
  );
}

function DirectMessageGroup({
  onReply,
  messages,
  ...props
}: Omit<MessageGroupProps, "renderContent" | "messages"> & {
  messages: (NostrEvent | Rumor)[];
  onReply?: (message: NostrEvent | Rumor) => void;
}) {
  const account = useActiveAccount()!;
  const toast = useToast();

  const renderContent = useCallback((message: NostrEvent | Rumor) => <DirectMessageContent message={message} />, []);

  const renderActions = useCallback(
    (message: NostrEvent) => {
      return <DirectMessageActions message={message} onReply={onReply} account={account} toast={toast} />;
    },
    [account, toast],
  );

  return (
    <MessagesGroup
      renderContent={renderContent}
      renderActions={renderActions}
      messages={messages as NostrEvent[]}
      {...props}
    />
  );
}

export default memo(DirectMessageGroup);
