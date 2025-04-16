import { Button, ButtonGroup, Flex, LinkBox, LinkOverlay, Text } from "@chakra-ui/react";
import { kinds, nip19 } from "nostr-tools";
import { useMemo } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList, ListChildComponentProps } from "react-window";

import { useActiveAccount } from "applesauce-react/hooks";
import { CheckIcon } from "../../components/icons";
import SimpleParentView from "../../components/layout/presets/simple-parent-view";
import RequireActiveAccount from "../../components/router/require-active-account";
import Timestamp from "../../components/timestamp";
import UserAvatar from "../../components/user/user-avatar";
import UserDnsIdentity from "../../components/user/user-dns-identity";
import UserName from "../../components/user/user-name";
import { KnownConversation, groupIntoConversations, hasResponded, identifyConversation } from "../../helpers/nostr/dms";
import { truncateId } from "../../helpers/string";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import { useKind4Decrypt } from "../../hooks/use-kind4-decryption";
import useRouteStateValue from "../../hooks/use-route-state-value";
import useScrollRestoreRef from "../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useUserContacts from "../../hooks/use-user-contacts";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import useUserMutes from "../../hooks/use-user-mutes";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { NostrEvent } from "../../types/nostr-event";

export function useDirectMessagesTimeline(pubkey?: string) {
  const mailboxes = useUserMailboxes(pubkey);

  return useTimelineLoader(
    `${truncateId(pubkey ?? "anon")}-dms`,
    mailboxes?.inboxes ?? [],
    pubkey
      ? [
          { authors: [pubkey], kinds: [kinds.EncryptedDirectMessage] },
          { "#p": [pubkey], kinds: [kinds.EncryptedDirectMessage] },
        ]
      : undefined,
  );
}

function MessagePreview({ message, pubkey }: { message: NostrEvent; pubkey: string }) {
  const ref = useEventIntersectionRef(message);

  const { plaintext } = useKind4Decrypt(message);
  return (
    <Text isTruncated ref={ref}>
      {plaintext || "<Encrypted>"}
    </Text>
  );
}

function ConversationCard({ index, style, data }: ListChildComponentProps<KnownConversation[]>) {
  const conversation = data[index];

  const location = useLocation();
  const lastReceived = conversation.messages.find((m) => m.pubkey === conversation.correspondent);
  const lastMessage = conversation.messages[0];

  const ref = useEventIntersectionRef(lastMessage);

  return (
    <LinkBox as={Flex} ref={ref} style={style} gap="2" overflow="hidden" px="2">
      <UserAvatar pubkey={conversation.correspondent} />
      <Flex direction="column" gap="1" overflow="hidden" flex={1}>
        <Flex gap="2" alignItems="center" overflow="hidden">
          <UserName pubkey={conversation.correspondent} isTruncated />
          <UserDnsIdentity onlyIcon pubkey={conversation.correspondent} />
          <Timestamp flexShrink={0} timestamp={lastMessage.created_at} ml="auto" />
          {hasResponded(conversation) && <CheckIcon boxSize={4} color="green.500" />}
        </Flex>
        {lastReceived && <MessagePreview message={lastReceived} pubkey={lastReceived.pubkey} />}
      </Flex>
      <LinkOverlay as={RouterLink} to={`/messages/${nip19.npubEncode(conversation.correspondent)}` + location.search} />
    </LinkBox>
  );
}

function MessagesHomePage() {
  const { value: filter, setValue: setFilter } = useRouteStateValue<"contacts" | "other" | "muted">("tab", "contacts");

  const account = useActiveAccount()!;
  const contacts = useUserContacts(account?.pubkey, undefined, true)?.map((p) => p.pubkey);
  const mutes = useUserMutes(account.pubkey, undefined, true);

  const { timeline: messages, loader } = useDirectMessagesTimeline(account.pubkey);

  const conversations = useMemo(() => {
    const conversations = groupIntoConversations(messages).map((c) => identifyConversation(c, account.pubkey));

    let filtered = conversations;
    switch (filter) {
      case "contacts":
        filtered = conversations.filter((c) => contacts?.includes(c.correspondent));
        break;
      case "muted":
        filtered = conversations.filter((c) => mutes?.pubkeys?.has(c.correspondent));
        break;
      case "other":
        filtered = conversations.filter(
          (c) => !contacts?.includes(c.correspondent) && !mutes?.pubkeys.has(c.correspondent),
        );
        break;
    }

    return filtered.sort((a, b) => b.messages[0].created_at - a.messages[0].created_at);
  }, [messages, account.pubkey, contacts?.length, filter, mutes?.pubkeys.size]);

  const callback = useTimelineCurserIntersectionCallback(loader);
  const scroll = useScrollRestoreRef("chats");

  return (
    <SimpleParentView path="/messages" width="md" title="Messages" scroll={false}>
      <ButtonGroup p="2" size="sm" variant="outline">
        <Button onClick={() => setFilter("contacts")} variant={filter === "contacts" ? "solid" : "outline"}>
          Contacts
        </Button>
        <Button onClick={() => setFilter("other")} variant={filter === "other" ? "solid" : "outline"}>
          Other
        </Button>
        <Button onClick={() => setFilter("muted")} variant={filter === "muted" ? "solid" : "outline"}>
          Muted
        </Button>
      </ButtonGroup>
      <IntersectionObserverProvider callback={callback}>
        <Flex flex={1} overflow="hidden" position="relative">
          <AutoSizer>
            {({ width, height }) => (
              <FixedSizeList
                height={height}
                width={width}
                itemData={conversations ?? []}
                itemCount={conversations?.length ?? 0}
                itemKey={(i, data) => data[i].myself + data[i].correspondent}
                itemSize={64}
                innerRef={scroll}
              >
                {ConversationCard}
              </FixedSizeList>
            )}
          </AutoSizer>
        </Flex>
      </IntersectionObserverProvider>
    </SimpleParentView>
  );
}

export default function MessagesHomeView() {
  return (
    <RequireActiveAccount>
      <MessagesHomePage />
    </RequireActiveAccount>
  );
}
