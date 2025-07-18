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
import { mergeRelaySets, Rumor } from "applesauce-core/helpers";
import { GiftWrapsModel, LegacyMessagesGroups, WrappedMessagesGroups } from "applesauce-core/models";
import { useActiveAccount, useEventModel, useObservableEagerState, useObservableState } from "applesauce-react/hooks";
import { NostrEvent, kinds } from "nostr-tools";
import { npubEncode } from "nostr-tools/nip19";
import { useEffect, useMemo } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

import { SettingsIcon } from "../../components/icons";
import SimpleParentView from "../../components/layout/presets/simple-parent-view";
import RequireActiveAccount from "../../components/router/require-active-account";
import Timestamp from "../../components/timestamp";
import UserAvatar from "../../components/user/user-avatar";
import UserName from "../../components/user/user-name";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import { useLegacyMessagePlaintext } from "../../hooks/use-legacy-message-plaintext";
import useScrollRestoreRef from "../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useUserInbox } from "../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import RequireDecryptionCache from "../../providers/route/require-decryption-cache";
import { legacyMessageSubscription, wrappedMessageSubscription } from "../../services/lifecycle";
import localSettings from "../../services/preferences";
import { DirectMessageRelays } from "../../models/messages";
import ReadAuthRequiredAlert from "./components/read-auth-required-alert";

function MessagePreview({ message }: { message: NostrEvent }) {
  const { plaintext } = useLegacyMessagePlaintext(message);
  return plaintext ? <Text isTruncated>{plaintext || "<Encrypted>"}</Text> : <Badge variant="subtle">Encrypted</Badge>;
}

function ConversationCard({ index, style, data }: ListChildComponentProps<(LegacyGroup | WrappedGroup)[]>) {
  const account = useActiveAccount()!;
  const conversation = data[index];

  const location = useLocation();
  const lastMessage = conversation.lastMessage;

  const ref = useEventIntersectionRef(lastMessage as NostrEvent);
  const others = conversation.participants.filter((p) => p !== account.pubkey);

  return (
    <LinkBox as={Flex} ref={ref} style={style} gap="2" overflow="hidden" px="2">
      <AvatarGroup size="md" max={3}>
        {others.map((pubkey) => (
          <UserAvatar key={pubkey} pubkey={pubkey} />
        ))}
      </AvatarGroup>
      <Flex direction="column" gap="1" overflow="hidden" flex={1} py="2" alignItems="flex-start">
        <Flex gap="2" alignItems="center" overflow="hidden" w="full">
          <Text fontSize="sm" isTruncated>
            {others.map((pubkey, index) => (
              <span key={pubkey}>
                <UserName pubkey={pubkey} />
                {index < others.length - 1 && ", "}
              </span>
            ))}
          </Text>
          <Timestamp flexShrink={0} timestamp={lastMessage.created_at} ml="auto" />
        </Flex>
        {lastMessage.kind === kinds.EncryptedDirectMessage ? (
          <MessagePreview message={lastMessage as NostrEvent} />
        ) : (
          <Text fontSize="sm" isTruncated>
            {lastMessage.content}
          </Text>
        )}
      </Flex>
      <LinkOverlay
        as={RouterLink}
        to={
          others.length > 1
            ? `/messages/group/${others.map(npubEncode).join(":")}`
            : `/messages/${others.map(npubEncode).join(":")}` + location.search
        }
      />
    </LinkBox>
  );
}

type LegacyGroup = NonNullable<{ id: string; participants: string[]; lastMessage: NostrEvent }>;
type WrappedGroup = NonNullable<{ id: string; participants: string[]; lastMessage: Rumor }>;

function Groups() {
  const account = useActiveAccount()!;

  // Subscribe to incoming messages
  useObservableState(legacyMessageSubscription);
  useObservableState(wrappedMessageSubscription);

  // Create a timeline loader for legacy messages
  const legacyInboxes = useUserInbox(account.pubkey);
  const messagesInboxes = useEventModel(DirectMessageRelays, [account.pubkey]);
  const inboxes = useMemo(() => mergeRelaySets(legacyInboxes, messagesInboxes), [legacyInboxes, messagesInboxes]);
  const { loader } = useTimelineLoader(`${account.pubkey}-legacy-messages`, legacyInboxes ?? [], [
    { authors: [account.pubkey], kinds: [kinds.EncryptedDirectMessage] },
    { "#p": [account.pubkey], kinds: [kinds.EncryptedDirectMessage] },
  ]);

  // Start the legacy messages timeline
  useEffect(() => {
    loader?.();
  }, [loader]);

  const legacyGroups = useEventModel(LegacyMessagesGroups, [account.pubkey]);
  const wrappedGroups = useEventModel(WrappedMessagesGroups, [account.pubkey]);

  const groups = useMemo(() => {
    const byId = new Map<string, LegacyGroup | WrappedGroup>();
    const all: (LegacyGroup | WrappedGroup)[] = [...(legacyGroups ?? []), ...(wrappedGroups ?? [])];

    for (const group of all) {
      const existing = byId.get(group.id);
      if (existing) {
        if (existing.lastMessage.created_at < group.lastMessage.created_at) byId.set(group.id, group);
      } else byId.set(group.id, group);
    }

    return Array.from(byId.values()).sort((a, b) => b.lastMessage.created_at - a.lastMessage.created_at);
  }, [legacyGroups, wrappedGroups]);

  const scroll = useScrollRestoreRef("chats");
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <ReadAuthRequiredAlert relays={inboxes} flexShrink={0} />
      <Flex flex={1} overflow="hidden" position="relative">
        <AutoSizer>
          {({ width, height }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemData={groups ?? []}
              itemCount={groups?.length ?? 0}
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
    </IntersectionObserverProvider>
  );
}

function MessagesHomePage() {
  const account = useActiveAccount()!;

  // Automatically decrypt new wrapped messages
  const autoDecryptMessages = useObservableEagerState(localSettings.autoDecryptMessages);
  const locked = useEventModel(GiftWrapsModel, [account.pubkey, true]);

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
