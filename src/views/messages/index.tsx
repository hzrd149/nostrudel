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
import { mergeRelaySets } from "applesauce-core/helpers";
import { Rumor } from "applesauce-common/helpers";
import { LegacyMessagesGroups, WrappedMessagesGroups } from "applesauce-common/models";
import { useActiveAccount, useEventModel, use$ } from "applesauce-react/hooks";
import { NostrEvent, kinds } from "nostr-tools";
import { BehaviorSubject } from "rxjs";
import { npubEncode } from "nostr-tools/nip19";
import { useEffect, useMemo } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

import ignoreRelayErrors from "../../helpers/ignore-relay-errors";
import { SettingsIcon } from "../../components/icons";
import SimpleParentView from "../../components/layout/presets/simple-parent-view";
import RequireActiveAccount from "../../components/router/require-active-account";
import Timestamp from "../../components/timestamp";
import UserAvatar from "../../components/user/user-avatar";
import UserName from "../../components/user/user-name";
import { useLegacyMessagePlaintext } from "../../hooks/use-legacy-message-plaintext";
import { loadTimelineWhileVisible } from "../../helpers/load-timeline-window";
import useGiftWrapDecryption from "../../hooks/use-gift-wrap-decryption";
import useScrollRestoreRef from "../../hooks/use-scroll-restore";
import { useUserInbox } from "../../hooks/use-user-mailboxes";
import RequireDecryptionCache from "../../providers/route/require-decryption-cache";
import { createLegacyInboxLoader } from "../../services/legacy-messages";
import { legacyMessageSubscription, wrappedMessageSubscription } from "../../services/lifecycle";
import { DirectMessageRelaysModel } from "../../models/messages";
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

type LegacyGroup = NonNullable<{ id: string; participants: string[]; lastMessage: NostrEvent }>;
type WrappedGroup = NonNullable<{ id: string; participants: string[]; lastMessage: Rumor }>;
/** A conversation row, the pinned notes to self row has no message until the first note is written */
type Conversation = { id: string; participants: string[]; lastMessage?: NostrEvent | Rumor };

function Groups() {
  const account = useActiveAccount()!;

  // Subscribe to incoming messages
  use$(legacyMessageSubscription);
  use$(wrappedMessageSubscription);

  const legacyInboxes = useUserInbox(account.pubkey);
  const messagesInboxes = useEventModel(DirectMessageRelaysModel, [account.pubkey]);
  const inboxes = useMemo(() => mergeRelaySets(legacyInboxes, messagesInboxes), [legacyInboxes, messagesInboxes]);

  // Load older NIP-04 messages while the end of the conversation list is on screen
  const listEnd$ = useMemo(() => new BehaviorSubject(true), []);
  const loader = useMemo(() => createLegacyInboxLoader(account.pubkey), [account.pubkey]);
  useEffect(() => {
    const sub = loadTimelineWhileVisible(loader, listEnd$).pipe(ignoreRelayErrors("Message history")).subscribe();
    return () => sub.unsubscribe();
  }, [loader, listEnd$]);

  // v5: useEventModel expects array of arguments
  const legacyGroups = useEventModel(LegacyMessagesGroups, [account.pubkey]) ?? [];
  const wrappedGroups = useEventModel(WrappedMessagesGroups, [account.pubkey]) ?? [];

  const groups = useMemo(() => {
    const byId = new Map<string, LegacyGroup | WrappedGroup>();
    const all: (LegacyGroup | WrappedGroup)[] = [...(legacyGroups ?? []), ...(wrappedGroups ?? [])];

    for (const group of all) {
      const existing = byId.get(group.id);
      if (existing) {
        if (existing.lastMessage.created_at < group.lastMessage.created_at) byId.set(group.id, group);
      } else byId.set(group.id, group);
    }

    // A conversation with only yourself is the notes to self channel, pinned to the top
    const notes: Conversation = byId.get(account.pubkey) ?? { id: account.pubkey, participants: [account.pubkey] };
    byId.delete(account.pubkey);
    const others = Array.from(byId.values()).sort((a, b) => b.lastMessage.created_at - a.lastMessage.created_at);
    return [notes, ...others];
  }, [legacyGroups, wrappedGroups, account.pubkey]);

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
              onItemsRendered={({ visibleStopIndex }) => listEnd$.next(visibleStopIndex >= groups.length - 1)}
            >
              {ConversationCard}
            </FixedSizeList>
          )}
        </AutoSizer>
      </Flex>
    </>
  );
}

function MessagesHomePage() {
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
      <Groups />
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
