import { ButtonGroup, IconButton, Menu, MenuButton, MenuItem, MenuList, useToast } from "@chakra-ui/react";
import { getConversationParticipants, Rumor } from "applesauce-common/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { memo, useCallback } from "react";

import DebugEventMenuItem from "../../../components/debug-modal/debug-event-menu-item";
import { CopyToClipboardIcon, ReplyIcon } from "../../../components/icons";
import DotsHorizontal from "../../../components/icons/dots-horizontal";
import DeleteEventMenuItem from "../../../components/menu/delete-event";
import MessagesGroup, { MessageGroupProps } from "../../../components/message/message-group";
import AddReactionButton from "../../../components/timeline/note/components/add-reaction-button";
import EventZapButton from "../../../components/zap/event-zap-button";
import { useLegacyMessagePlaintext } from "../../../hooks/use-legacy-message-plaintext";
import DirectMessageContent from "./direct-message-content";
import MessageExpiration from "./message-expiration";
import useMessaging from "../../../hooks/use-messaging";
import useAsyncAction from "../../../hooks/use-async-action";

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
  const session = useMessaging();
  const isOwnMessage = message.pubkey === account.pubkey;
  const canDelete = isOwnMessage && message.kind === kinds.EncryptedDirectMessage;

  const reply = useAsyncAction(async () => {
    if (message.kind === kinds.EncryptedDirectMessage) {
      onReply?.(message);
      return;
    }
    const conversation = session?.wrapped.conversation(getConversationParticipants(message));
    if (!conversation) throw new Error("Messaging is not ready");
    const draft = await conversation.loadDraft();
    await conversation.setDraft({ ...draft, content: draft?.content ?? "", replyTo: message.id });
  }, [session, message, onReply]);
  const copy = useAsyncAction(async () => {
    const text = message.kind === kinds.EncryptedDirectMessage ? plaintext : message.content;
    if (text) await navigator.clipboard.writeText(text);
    toast({ title: "Text copied to clipboard", status: "success", duration: 2000 });
  }, [message, plaintext, toast]);

  return (
    <ButtonGroup variant="ghost" gap="0">
      {(message.kind !== kinds.EncryptedDirectMessage || onReply) && (
        <IconButton aria-label="Reply" icon={<ReplyIcon boxSize={5} />} onClick={reply.run} isLoading={reply.loading} />
      )}
      {/* Only show reactions and zaps for legacy messages (NIP-04), not NIP-17 */}
      {message?.kind === kinds.EncryptedDirectMessage && (
        <>
          <AddReactionButton event={message as NostrEvent} />
          <EventZapButton event={message as NostrEvent} />
        </>
      )}
      <Menu>
        <MenuButton as={IconButton} aria-label="More actions" icon={<DotsHorizontal boxSize={5} />} />
        <MenuList>
          <MenuItem icon={<CopyToClipboardIcon />} onClick={copy.run}>
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
  const renderMetadata = useCallback((message: NostrEvent) => <MessageExpiration message={message} />, []);

  const renderActions = useCallback(
    (message: NostrEvent) => {
      return <DirectMessageActions message={message} onReply={onReply} account={account} toast={toast} />;
    },
    [account, toast, onReply],
  );

  return (
    <MessagesGroup
      renderContent={renderContent}
      renderActions={renderActions}
      renderMetadata={renderMetadata}
      messages={messages as NostrEvent[]}
      {...props}
    />
  );
}

export default memo(DirectMessageGroup);
