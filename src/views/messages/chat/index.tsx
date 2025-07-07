import { ButtonGroup, Flex, IconButton } from "@chakra-ui/react";
import { getExpirationTimestamp, getRumorGiftWraps, isEvent, mergeRelaySets, Rumor } from "applesauce-core/helpers";
import { LegacyMessagesGroup, WrappedMessagesGroup } from "applesauce-core/models";
import { useActiveAccount, useEventModel, useObservableState } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { memo, useCallback, useContext, useEffect, useMemo } from "react";
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
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useRouterMarker from "../../../hooks/use-router-marker";
import useScrollRestoreRef from "../../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useUserInbox } from "../../../hooks/use-user-mailboxes";
import { DirectMessageRelays } from "../../../models/messages";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { legacyMessageSubscription, wrappedMessageSubscription } from "../../../services/lifecycle";
import DirectMessageGroup from "../components/direct-message-group";
import PendingLockedAlert from "../components/pending-decryption-alert";
import ReadAuthRequiredAlert from "../components/read-auth-required-alert";
import SendMessageForm from "./components/direct-message-form";
import DirectMessageRelayConnectionsButton from "./components/direct-message-relay-connections";
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

  // Keep a subscription open for NIP-04 and NIP-17 messages
  useObservableState(legacyMessageSubscription);
  useObservableState(wrappedMessageSubscription);

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

  // NOTE: its probably not a great idea to read from the other users inboxes, but it does help load missing messages
  const otherLegacyInboxes = useUserInbox(pubkey);
  const selfLegacyInboxes = useUserInbox(account.pubkey);
  const legacyInboxes = useMemo(
    () => mergeRelaySets(selfLegacyInboxes, otherLegacyInboxes),
    [selfLegacyInboxes, otherLegacyInboxes],
  );

  const { loader } = useTimelineLoader(
    `${truncateId(pubkey)}-${truncateId(account.pubkey)}-messages`,
    legacyInboxes,
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
    {},
  );

  const inboxes = useEventModel(DirectMessageRelays, [account.pubkey]);
  const allReadRelays = useMemo(() => mergeRelaySets(legacyInboxes, inboxes), [legacyInboxes, inboxes]);

  const legacyMessages = useEventModel(LegacyMessagesGroup, [account.pubkey, pubkey]);
  const wrappedMessages = useEventModel(WrappedMessagesGroup, [account.pubkey, pubkey]);
  const messages = useMemo<(NostrEvent | Rumor)[]>(
    () => [...(legacyMessages ?? []), ...(wrappedMessages ?? [])].sort(sortByDate),
    [legacyMessages, wrappedMessages],
  );

  // Get the last message from the other user or self
  const lastReceivedMessage = useMemo<NostrEvent | Rumor | undefined>(
    () => messages.find((m) => m.pubkey === pubkey) || messages[0],
    [messages, pubkey],
  );
  const lastExpiration = useMemo<number | undefined>(() => {
    for (const message of messages) {
      if (message.kind === kinds.EncryptedDirectMessage && isEvent(message)) {
        const ts = getExpirationTimestamp(message);
        if (ts) return ts - message.created_at;
      } else if (message.kind === kinds.EncryptedDirectMessage) {
        const giftWrap = getRumorGiftWraps(message)[0];
        const ts = getExpirationTimestamp(giftWrap);
        if (ts) return ts - message.created_at;
      }
    }
    return undefined;
  }, [messages]);

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
            <DirectMessageRelayConnectionsButton other={pubkey} variant="ghost" onClick={openSettingsDrawer} />
            <IconButton
              aria-label="Settings"
              title="Conversation Settings"
              icon={<SettingsIcon boxSize={5} />}
              onClick={openSettingsDrawer}
              variant="ghost"
            />
          </ButtonGroup>
        }
        scroll={false}
        flush
        gap="0"
      >
        <Flex direction="column-reverse" gap="2" flexGrow={1} h={0} overflowX="hidden" overflowY="auto" ref={scroll}>
          <PendingLockedAlert />
          <ChatLog messages={messages} />
          <TimelineActionAndStatus loader={loader} />
        </Flex>

        <ReadAuthRequiredAlert relays={allReadRelays} />
        <SendMessageForm
          flexShrink={0}
          pubkey={pubkey}
          p="2"
          initialType={lastReceivedMessage?.kind === kinds.EncryptedDirectMessage ? "nip04" : "nip17"}
          initialExpiration={lastExpiration}
        />

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
