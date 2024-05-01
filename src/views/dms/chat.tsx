import { memo, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Button, ButtonGroup, Card, Flex, IconButton } from "@chakra-ui/react";
import { UNSAFE_DataRouterContext, useLocation, useNavigate } from "react-router-dom";
import { kinds } from "nostr-tools";

import { ChevronLeftIcon, ThreadIcon } from "../../components/icons";
import UserAvatar from "../../components/user/user-avatar";
import UserLink from "../../components/user/user-link";
import useSubject from "../../hooks/use-subject";
import RequireCurrentAccount from "../../providers/route/require-current-account";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useCurrentAccount from "../../hooks/use-current-account";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import UserDnsIdentity from "../../components/user/user-dns-identity";
import { useDecryptionContext } from "../../providers/global/dycryption-provider";
import SendMessageForm from "./components/send-message-form";
import { groupMessages } from "../../helpers/nostr/dms";
import ThreadDrawer from "./components/thread-drawer";
import ThreadsProvider from "../../providers/local/thread-provider";
import { useRouterMarker } from "../../providers/drawer-sub-view-provider";
import TimelineLoader from "../../classes/timeline-loader";
import DirectMessageBlock from "./components/direct-message-block";
import useParamsProfilePointer from "../../hooks/use-params-pubkey-pointer";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import RelaySet from "../../classes/relay-set";
import useAppSettings from "../../hooks/use-app-settings";
import { truncateId } from "../../helpers/string";

/** This is broken out from DirectMessageChatPage for performance reasons. Don't use outside of file */
const ChatLog = memo(({ timeline }: { timeline: TimelineLoader }) => {
  const messages = useSubject(timeline.timeline);
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
  const { getOrCreateContainer, addToQueue, startQueue } = useDecryptionContext();

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

  const otherMailboxes = useUserMailboxes(pubkey);
  const mailboxes = useUserMailboxes(account.pubkey);
  const timeline = useTimelineLoader(
    `${truncateId(pubkey)}-${truncateId(account.pubkey)}-messages`,
    RelaySet.from(mailboxes?.inbox, mailboxes?.outbox, otherMailboxes?.inbox, otherMailboxes?.outbox),
    [
      {
        kinds: [kinds.EncryptedDirectMessage],
        "#p": [account.pubkey, pubkey],
        authors: [pubkey, account.pubkey],
      },
    ],
  );

  const [loading, setLoading] = useState(false);
  const decryptAll = async () => {
    const promises = timeline.timeline.value
      .map((message) => {
        const container = getOrCreateContainer(pubkey, message.content);
        if (container.plaintext.value === undefined) return addToQueue(container);
      })
      .filter(Boolean);

    startQueue();

    setLoading(true);
    Promise.all(promises).finally(() => setLoading(false));
  };

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <ThreadsProvider timeline={timeline}>
      <IntersectionObserverProvider callback={callback}>
        <Card size="sm" flexShrink={0} p="2" flexDirection="row">
          <Flex gap="2" alignItems="center">
            <IconButton
              variant="ghost"
              icon={<ChevronLeftIcon />}
              aria-label="Back"
              onClick={() => navigate(-1)}
              hideFrom="xl"
            />
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
          <ChatLog timeline={timeline} />
          <TimelineActionAndStatus timeline={timeline} />
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
