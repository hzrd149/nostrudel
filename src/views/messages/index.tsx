import {
  AvatarGroup,
  Badge,
  Button,
  ButtonGroup,
  Flex,
  IconButton,
  LinkBox,
  LinkOverlay,
  Text,
} from "@chakra-ui/react";
import { Rumor } from "applesauce-common/helpers";
import { useActiveAccount, use$ } from "applesauce-react/hooks";
import { NostrEvent, kinds } from "nostr-tools";
import { npubEncode } from "nostr-tools/nip19";
import { useMemo } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

import { SettingsIcon } from "../../components/icons";
import SimpleParentView from "../../components/layout/presets/simple-parent-view";
import RequireActiveAccount from "../../components/router/require-active-account";
import Timestamp from "../../components/timestamp";
import UserAvatar from "../../components/user/user-avatar";
import UserName from "../../components/user/user-name";
import { useLegacyMessagePlaintext } from "../../hooks/use-legacy-message-plaintext";
import useMessaging from "../../hooks/use-messaging";
import useGiftWrapDecryption from "../../hooks/use-gift-wrap-decryption";
import useScrollRestoreRef from "../../hooks/use-scroll-restore";
import RequireDecryptionCache from "../../providers/route/require-decryption-cache";
import GiftWrapSync from "./inbox/components/gift-wrap-sync";
import ReadAuthRequiredAlert from "./components/read-auth-required-alert";

function MessagePreview({ message }: { message: NostrEvent }) {
  const { plaintext } = useLegacyMessagePlaintext(message);
  return plaintext ? <Text isTruncated>{plaintext || "<Encrypted>"}</Text> : <Badge variant="subtle">Encrypted</Badge>;
}

function ConversationPreview({ lastMessage }: { lastMessage: NostrEvent | Rumor }) {
  if (lastMessage.kind === kinds.EncryptedDirectMessage) return <MessagePreview message={lastMessage as NostrEvent} />;
  return (
    <Text fontSize="sm" isTruncated>
      {lastMessage.content}
    </Text>
  );
}

function ConversationCard({ index, style, data }: ListChildComponentProps<Conversation[]>) {
  const account = useActiveAccount()!;
  const conversation = data[index];

  const location = useLocation();
  const lastMessage = conversation.lastMessage;

  const others = conversation.participants.filter((p) => p !== account.pubkey);
  const isSelf = others.length === 0;

  return (
    <LinkBox as={Flex} style={style} gap="2" overflow="hidden" px="2">
      <AvatarGroup size="md" max={3}>
        {(isSelf ? [account.pubkey] : others).map((pubkey) => (
          <UserAvatar key={pubkey} pubkey={pubkey} />
        ))}
      </AvatarGroup>
      <Flex direction="column" gap="1" overflow="hidden" flex={1} py="2" alignItems="flex-start">
        <Flex gap="2" alignItems="center" overflow="hidden" w="full">
          <Text fontSize="sm" isTruncated>
            {isSelf
              ? "Notes to self"
              : others.map((pubkey, index) => (
                  <span key={pubkey}>
                    <UserName pubkey={pubkey} />
                    {index < others.length - 1 && ", "}
                  </span>
                ))}
          </Text>
          {lastMessage && <Timestamp flexShrink={0} timestamp={lastMessage.created_at} ml="auto" />}
        </Flex>
        {lastMessage ? (
          <ConversationPreview lastMessage={lastMessage} />
        ) : (
          <Text fontSize="sm" color="GrayText" isTruncated>
            Private notes only you can read
          </Text>
        )}
      </Flex>
      <LinkOverlay
        as={RouterLink}
        to={
          others.length > 1
            ? `/messages/group/${others.map(npubEncode).join(":")}`
            : `/messages/${npubEncode(isSelf ? account.pubkey : others[0])}` + location.search
        }
      />
    </LinkBox>
  );
}

/** A conversation row, the pinned notes to self row has no message until the first note is written */
type Conversation = { id: string; participants: string[]; lastMessage?: NostrEvent | Rumor };

function Groups() {
  const account = useActiveAccount()!;

  const session = useMessaging();
  const inboxes = use$(() => session?.relays$, [session]) ?? [];
  const conversations = use$(() => session?.conversations$, [session]);

  const groups = useMemo(() => {
    const notes: Conversation = conversations?.find((row) => row.id === account.pubkey) ?? {
      id: account.pubkey,
      participants: [account.pubkey],
    };
    const others = conversations?.filter((row) => row.id !== account.pubkey) ?? [];
    return [notes, ...others];
  }, [conversations, account.pubkey]);

  const scroll = useScrollRestoreRef("chats");

  return (
    <>
      <ReadAuthRequiredAlert relays={inboxes} flexShrink={0} />
      <Flex flex={1} overflow="hidden" position="relative">
        <AutoSizer>
          {({ width, height }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemData={groups}
              itemCount={groups.length}
              itemKey={(i, data) => data[i].id}
              itemSize={64}
              innerRef={scroll}
              overscanCount={10}
            >
              {ConversationCard}
            </FixedSizeList>
          )}
        </AutoSizer>
      </Flex>
      <GiftWrapSync />
    </>
  );
}

function MessagesHomePage() {
  const account = useActiveAccount()!;
  const { locked } = useGiftWrapDecryption();

  return (
    <SimpleParentView
      path="/messages"
      width="md"
      title="Messages"
      scroll={false}
      actions={
        <ButtonGroup variant="ghost" ms="auto">
          <Button as={RouterLink} to="/messages/inbox" variant="ghost">
            Inbox{locked && locked.length > 0 && ` (${locked.length})`}
          </Button>
          <IconButton
            as={RouterLink}
            to="/settings/messages"
            aria-label="Settings"
            icon={<SettingsIcon boxSize={5} />}
          />
        </ButtonGroup>
      }
    >
      <Groups key={account.pubkey} />
    </SimpleParentView>
  );
}

export default function MessagesHomeView() {
  return (
    <RequireActiveAccount>
      <RequireDecryptionCache>
        <MessagesHomePage />
      </RequireDecryptionCache>
    </RequireActiveAccount>
  );
}
