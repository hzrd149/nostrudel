import { memo, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Button, ButtonGroup, Card, Flex, IconButton } from "@chakra-ui/react";
import { UNSAFE_DataRouterContext, useLocation, useNavigate } from "react-router-dom";
import { NostrEvent, kinds } from "nostr-tools";

import { ThreadIcon } from "../../components/icons";
import UserAvatar from "../../components/user/user-avatar";
import UserLink from "../../components/user/user-link";
import RequireCurrentAccount from "../../components/router/require-current-account";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useCurrentAccount from "../../hooks/use-current-account";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import UserDnsIdentity from "../../components/user/user-dns-identity";
import SendMessageForm from "./components/send-message-form";
import { groupMessages } from "../../helpers/nostr/dms";
import ThreadDrawer from "./components/thread-drawer";
import ThreadsProvider from "../../providers/local/thread-provider";
import DirectMessageBlock from "./components/direct-message-block";
import useParamsProfilePointer from "../../hooks/use-params-pubkey-pointer";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import RelaySet from "../../classes/relay-set";
import useAppSettings from "../../hooks/use-user-app-settings";
import { truncateId } from "../../helpers/string";
import useRouterMarker from "../../hooks/use-router-marker";
import { BackIconButton } from "../../components/router/back-button";
import decryptionCacheService from "../../services/decryption-cache";

/** This is broken out from DirectMessageChatPage for performance reasons. Don't use outside of file */
const ChatLog = memo(({ messages }: { messages: NostrEvent[] }) => {
  const filteredMessages = useMemo(
    () => messages.filter((e) => !e.tags.some((t) => t[0] === "e" && t[3] === "root")),
    [messages.length],
  );
  const grouped = useMemo(() => groupMessages(filteredMessages), [filteredMessages]);

  return (
    <>
      {grouped.map((group) => (
        <DirectMessageBlock key={group.id} messages={group.events} reverse />
      ))}
    </>
  );
});

function DirectMessageChatPage({ pubkey }: { pubkey: string }) {
  const account = useCurrentAccount()!;
  const { autoDecryptDMs } = useAppSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const { router } = useContext(UNSAFE_DataRouterContext)!;
  const marker = useRouterMarker(router);
  useEffect(() => {
    if (location.state?.thread && marker.index.current === null) {
      // the drawer just open, set the marker
      marker.set(1);
    }
  }, [location]);

  const openDrawerList = useCallback(() => {
    marker.set(0);
    navigate(".", { state: { thread: "list" } });
  }, [marker, navigate]);

  const closeDrawer = useCallback(() => {
    if (marker.index.current !== null && marker.index.current > 0) {
      navigate(-marker.index.current);
    } else navigate(".", { state: { thread: undefined } });
    marker.reset();
  }, [marker, navigate]);

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      const from = event.pubkey;
      const to = event.tags.find((t) => t[0] === "p")?.[1];

      return (from === account.pubkey && to === pubkey) || (from === pubkey && to === account.pubkey);
    },
    [account, pubkey],
  );

  const otherMailboxes = useUserMailboxes(pubkey);
  const mailboxes = useUserMailboxes(account.pubkey);
  const { loader, timeline: messages } = useTimelineLoader(
    `${truncateId(pubkey)}-${truncateId(account.pubkey)}-messages`,
    RelaySet.from(mailboxes?.inboxes, mailboxes?.outboxes, otherMailboxes?.inboxes, otherMailboxes?.outboxes),
    [
      {
        kinds: [kinds.EncryptedDirectMessage],
        "#p": [account.pubkey, pubkey],
        authors: [pubkey, account.pubkey],
      },
    ],
    { eventFilter },
  );

  const [loading, setLoading] = useState(false);
  const decryptAll = async () => {
    const promises = messages
      .map((message) => {
        const container = decryptionCacheService.getOrCreateContainer(message.id, "nip04", pubkey, message.content);
        return decryptionCacheService.requestDecrypt(container);
      })
      .filter(Boolean);

    setLoading(true);
    Promise.all(promises).finally(() => setLoading(false));
  };

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ThreadsProvider timeline={loader}>
      <IntersectionObserverProvider callback={callback}>
        <Card size="sm" flexShrink={0} p="2" flexDirection="row">
          <Flex gap="2" alignItems="center">
            <BackIconButton />
            <UserAvatar pubkey={pubkey} size="sm" />
            <UserLink pubkey={pubkey} fontWeight="bold" />
            <UserDnsIdentity pubkey={pubkey} onlyIcon />
          </Flex>
          <ButtonGroup ml="auto">
            {!autoDecryptDMs && (
              <Button onClick={decryptAll} isLoading={loading}>
                Decrypt All
              </Button>
            )}
            <IconButton
              aria-label="Threads"
              title="Threads"
              icon={<ThreadIcon boxSize={5} />}
              onClick={openDrawerList}
            />
          </ButtonGroup>
        </Card>
        <Flex h="0" flex={1} overflowX="hidden" overflowY="scroll" direction="column-reverse" gap="2" py="4" px="2">
          <ChatLog messages={messages} />
          <TimelineActionAndStatus timeline={loader} />
        </Flex>
        <SendMessageForm flexShrink={0} pubkey={pubkey} />
        {location.state?.thread && (
          <ThreadDrawer isOpen onClose={closeDrawer} threadId={location.state.thread} pubkey={pubkey} />
        )}
      </IntersectionObserverProvider>
    </ThreadsProvider>
  );
}

export default function DirectMessageChatView() {
  const { pubkey } = useParamsProfilePointer();

  return (
    <RequireCurrentAccount>
      <DirectMessageChatPage pubkey={pubkey} />
    </RequireCurrentAccount>
  );
}
