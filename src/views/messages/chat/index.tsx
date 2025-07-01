import { Button, ButtonGroup, Flex, IconButton } from "@chakra-ui/react";
import {
  isGiftWrapLocked,
  isLegacyMessageLocked,
  mergeRelaySets,
  Rumor,
  unlockGiftWrap,
  unlockLegacyMessage,
} from "applesauce-core/helpers";
import { GiftWrapsModel, LegacyMessagesGroup, WrappedMessagesGroup } from "applesauce-core/models";
import { useActiveAccount, useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { memo, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { Navigate, UNSAFE_DataRouterContext, useLocation, useNavigate, useParams } from "react-router-dom";

import { SettingsIcon } from "../../../components/icons";
import SimpleView from "../../../components/layout/presets/simple-view";
import RequireActiveAccount from "../../../components/router/require-active-account";
import TimelineActionAndStatus from "../../../components/timeline/timeline-action-and-status";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { groupMessages } from "../../../helpers/nostr/dms";
import { sortByDate } from "../../../helpers/nostr/event";
import { truncateId } from "../../../helpers/string";
import useAsyncAction from "../../../hooks/use-async-action";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useRouterMarker from "../../../hooks/use-router-marker";
import useScrollRestoreRef from "../../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useUserInbox } from "../../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import localSettings from "../../../services/local-settings";
import DirectMessageGroup from "../components/direct-message-group";
import PendingLockedAlert from "../components/pending-decryption-alert";
import SendMessageForm from "./components/direct-message-form";
import DirectMessageSettingsDrawer from "./components/direct-settings-drawer";

/** This is broken out from DirectMessageChatPage for performance reasons. Don't use outside of file */
const ChatLog = memo(({ messages }: { messages: (Rumor | NostrEvent)[] }) => {
  const grouped = useMemo(() => groupMessages(messages), [messages]);

  return (
    <>
      {grouped.map((group) => (
        <DirectMessageGroup key={group[0].id} messages={group} reverse />
      ))}
    </>
  );
});

function DirectMessageChatPage({ pubkey }: { pubkey: string }) {
  const account = useActiveAccount()!;
  const navigate = useNavigate();
  const location = useLocation();

  const { router } = useContext(UNSAFE_DataRouterContext)!;
  const marker = useRouterMarker(router);
  useEffect(() => {
    if (marker.index.current === null) {
      // the drawer just open, set the marker
      marker.set(1);
    }
  }, [location]);

  const openSettingsDrawer = useCallback(() => {
    marker.set(0);
    navigate(".", { state: { settings: true } });
  }, [navigate]);

  const closeDrawer = useCallback(() => {
    if (marker.index.current !== null && marker.index.current > 0) {
      navigate(-marker.index.current);
    } else navigate(".", { state: { settings: undefined } });
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

  const otherInbox = useUserInbox(pubkey);
  const inboxes = useUserInbox(account.pubkey);
  const { loader } = useTimelineLoader(
    `${truncateId(pubkey)}-${truncateId(account.pubkey)}-messages`,
    mergeRelaySets(inboxes, otherInbox),
    [
      {
        kinds: [kinds.EncryptedDirectMessage],
        "#p": [account.pubkey],
        authors: [pubkey],
      },
      {
        kinds: [kinds.EncryptedDirectMessage],
        "#p": [pubkey],
        authors: [account.pubkey],
      },
    ],
    { eventFilter },
  );

  const legacyMessages = useEventModel(LegacyMessagesGroup, [account.pubkey, pubkey]);
  const wrappedMessages = useEventModel(WrappedMessagesGroup, [account.pubkey, pubkey]);
  const messages = useMemo<(NostrEvent | Rumor)[]>(
    () => [...(legacyMessages ?? []), ...(wrappedMessages ?? [])].sort(sortByDate),
    [legacyMessages, wrappedMessages],
  );

  // Automatically decrypt wrapped messages
  const autoDecryptMessages = useObservableEagerState(localSettings.autoDecryptMessages);
  const locked = useEventModel(GiftWrapsModel, [account.pubkey, true]);
  const pending = useRef<Set<string>>(new Set());

  // Action to decrypt all messages
  const decryptAll = useAsyncAction(async () => {
    if (!legacyMessages || !locked) return;

    for (const giftWrap of locked) {
      if (isGiftWrapLocked(giftWrap) && !pending.current.has(giftWrap.id)) {
        pending.current.add(giftWrap.id);
        unlockGiftWrap(giftWrap, account).finally(() => pending.current.delete(giftWrap.id));
      }
    }
    for (const message of legacyMessages) {
      if (isLegacyMessageLocked(message) && !pending.current.has(message.id)) {
        pending.current.add(message.id);
        unlockLegacyMessage(message, account.pubkey, account).finally(() => pending.current.delete(message.id));
      }
    }
  }, [legacyMessages, locked, account]);

  // Callback to timeline loading
  const callback = useTimelineCurserIntersectionCallback(loader);

  // restore scroll on navigation
  const scroll = useScrollRestoreRef();

  return (
    <IntersectionObserverProvider callback={callback}>
      <SimpleView
        title={
          <Flex gap="2" alignItems="center">
            <UserAvatarLink pubkey={pubkey} size="sm" />
            <UserLink pubkey={pubkey} fontWeight="bold" />
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
              aria-label="Settings"
              title="Conversation Settings"
              icon={<SettingsIcon boxSize={5} />}
              onClick={openSettingsDrawer}
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
          <PendingLockedAlert />
          <ChatLog messages={messages} />
          <TimelineActionAndStatus loader={loader} />
        </Flex>

        <SendMessageForm flexShrink={0} pubkey={pubkey} px="2" pb="2" />

        <DirectMessageSettingsDrawer
          isOpen={!!location.state?.settings}
          onClose={closeDrawer}
          otherUserPubkey={pubkey}
        />
      </SimpleView>
    </IntersectionObserverProvider>
  );
}

export default function DirectMessageChatView() {
  const params = useParams();
  if (params.pubkey?.includes(":")) {
    return <Navigate to={`/messages/group/${params.pubkey}`} replace />;
  }

  const { pubkey } = useParamsProfilePointer();

  return (
    <RequireActiveAccount>
      <DirectMessageChatPage pubkey={pubkey} />
    </RequireActiveAccount>
  );
}
