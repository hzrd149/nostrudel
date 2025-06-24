import { ButtonGroup, IconButton, Menu, MenuButton, MenuItem, MenuList, useToast } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { memo, useCallback } from "react";

import { ReplyIcon } from "../../../components/icons";
import DotsHorizontal from "../../../components/icons/dots-horizontal";
import MessagesGroup, { MessageGroupProps } from "../../../components/message/message-group";
import AddReactionButton from "../../../components/note/timeline-note/components/add-reaction-button";
import EventZapButton from "../../../components/zap/event-zap-button";
import { useLegacyMessagePlaintext } from "../../../hooks/use-legacy-message-plaintext";
import DecryptPlaceholder from "./decrypt-placeholder";
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

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log("Delete message:", message.id);
  };

  return (
    <ButtonGroup size="xs" variant="ghost" gap="0">
      <IconButton aria-label="Reply" icon={<ReplyIcon />} onClick={handleReply} size="xs" />
      <AddReactionButton event={message} size="xs" />
      <EventZapButton event={message} size="xs" />
      <Menu>
        <MenuButton as={IconButton} aria-label="More actions" icon={<DotsHorizontal />} size="xs" />
        <MenuList fontSize="sm">
          <MenuItem onClick={handleCopyText}>Copy text</MenuItem>
          {isOwnMessage && (
            <MenuItem color="red.500" onClick={handleDelete}>
              Delete
            </MenuItem>
          )}
        </MenuList>
      </Menu>
    </ButtonGroup>
  );
}

function DirectMessageGroup({
  onReply,
  ...props
}: Omit<MessageGroupProps, "renderContent"> & {
  onReply?: (message: NostrEvent) => void;
}) {
  const account = useActiveAccount()!;
  const toast = useToast();

  const renderContent = useCallback(
    (message: NostrEvent) => (
      <DecryptPlaceholder message={message}>
        {(plaintext) => <DirectMessageContent event={message} text={plaintext} />}
      </DecryptPlaceholder>
    ),
    [],
  );

  const renderActions = useCallback(
    (message: NostrEvent) => {
      return <DirectMessageActions message={message} onReply={onReply} account={account} toast={toast} />;
    },
    [account, toast],
  );

  return <MessagesGroup renderContent={renderContent} renderActions={renderActions} {...props} />;
}

export default memo(DirectMessageGroup);
