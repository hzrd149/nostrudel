import { Button, ButtonGroup, Flex, IconButton } from "@chakra-ui/react";
import { isLegacyMessageLocked, mergeRelaySets, unlockLegacyMessage } from "applesauce-core/helpers";
import { useActiveAccount, useObservableEagerState } from "applesauce-react/hooks";
import { NostrEvent, kinds } from "nostr-tools";
import { memo, useCallback, useContext, useEffect, useMemo } from "react";
import { UNSAFE_DataRouterContext, useLocation, useNavigate } from "react-router-dom";

import { ThreadIcon } from "../../components/icons";
import SimpleView from "../../components/layout/presets/simple-view";
import RequireActiveAccount from "../../components/router/require-active-account";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserDnsIdentityIcon from "../../components/user/user-dns-identity-icon";
import UserLink from "../../components/user/user-link";
import { groupMessages } from "../../helpers/nostr/dms";
import { truncateId } from "../../helpers/string";
import useAsyncAction from "../../hooks/use-async-action";
import useParamsProfilePointer from "../../hooks/use-params-pubkey-pointer";
import useRouterMarker from "../../hooks/use-router-marker";
import useScrollRestoreRef from "../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import ThreadsProvider from "../../providers/local/thread-provider";
import localSettings from "../../services/local-settings";
import DirectMessageBlock from "./components/direct-message-block";
import DirectMessageSlackBlock from "./components/direct-message-slack-block";
import SendMessageForm from "./components/send-message-form";
import ThreadDrawer from "./components/thread-drawer";

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
        <DirectMessageSlackBlock key={group[0].id} messages={group} reverse />
      ))}
    </>
  );
});

function DirectMessageChatPage({ pubkey }: { pubkey: string }) {
  const account = useActiveAccount()!;
  const navigate = useNavigate();
  const location = useLocation();
  const autoDecryptMessages = useObservableEagerState(localSettings.autoDecryptMessages);

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
    mergeRelaySets(mailboxes?.inboxes, mailboxes?.outboxes, otherMailboxes?.inboxes, otherMailboxes?.outboxes),
    [
      {
        kinds: [kinds.EncryptedDirectMessage],
        "#p": [account.pubkey, pubkey],
        authors: [pubkey, account.pubkey],
      },
    ],
    { eventFilter },
  );

  const decryptAll = useAsyncAction(async () => {
    for (const message of messages) {
      if (isLegacyMessageLocked(message)) {
        await unlockLegacyMessage(message, account.pubkey, account);
      }
    }
  }, [messages, pubkey]);

  const callback = useTimelineCurserIntersectionCallback(loader);

  // restore scroll on navigation
  const scroll = useScrollRestoreRef();

  return (
    <ThreadsProvider messages={messages}>
      <IntersectionObserverProvider callback={callback}>
        <SimpleView
          title={
            <Flex gap="2" alignItems="center">
              <UserAvatarLink pubkey={pubkey} size="sm" />
              <UserLink pubkey={pubkey} fontWeight="bold" />
              <UserDnsIdentityIcon pubkey={pubkey} />
            </Flex>
          }
          actions={
            <ButtonGroup ml="auto">
              {!autoDecryptMessages && (
                <Button onClick={decryptAll.run} isLoading={decryptAll.loading}>
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
          }
          scroll={false}
          flush
        >
          <Flex
            direction="column-reverse"
            p="2"
            gap="2"
            flexGrow={1}
            h={0}
            overflowX="hidden"
            overflowY="auto"
            ref={scroll}
          >
            <ChatLog messages={messages} />
            <TimelineActionAndStatus loader={loader} />
          </Flex>

          <SendMessageForm flexShrink={0} pubkey={pubkey} px="2" pb="2" />

          {location.state?.thread && (
            <ThreadDrawer isOpen onClose={closeDrawer} threadId={location.state.thread} pubkey={pubkey} />
          )}
        </SimpleView>
      </IntersectionObserverProvider>
    </ThreadsProvider>
  );
}

export default function DirectMessageChatView() {
  const { pubkey } = useParamsProfilePointer();

  return (
    <RequireActiveAccount>
      <DirectMessageChatPage pubkey={pubkey} />
    </RequireActiveAccount>
  );
}
