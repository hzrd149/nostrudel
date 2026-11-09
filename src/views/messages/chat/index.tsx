import { ButtonGroup, Flex, IconButton, Text } from "@chakra-ui/react";
import { getRumorGiftWraps, Rumor } from "applesauce-common/helpers";
import { isEvent, getExpirationTimestamp } from "applesauce-core/helpers";
import { useActiveAccount, use$ } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { memo, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, UNSAFE_DataRouterContext, useLocation, useNavigate, useParams } from "react-router-dom";

import { SettingsIcon } from "../../../components/icons";
import SimpleView from "../../../components/layout/presets/simple-view";
import RequireActiveAccount from "../../../components/router/require-active-account";
import LoadMoreButton from "../../../components/timeline/load-more-button";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { groupMessages } from "../../../helpers/nostr/dms";
import { sortByDate } from "../../../helpers/nostr/event";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useRouterMarker from "../../../hooks/use-router-marker";
import useScrollRestoreRef from "../../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import useMessaging from "../../../hooks/use-messaging";
import localSettings from "../../../services/preferences";
import DirectMessageGroup from "../components/direct-message-group";
import ExpirationToggleButton from "../components/expiration-toggle-button";
import DecryptLegacyMessagesButton from "./components/decrypt-legacy-messages-button";
import SendMessageForm, { MessageTypeToggleButton, type MessageType } from "./components/direct-message-form";
import useMessagePublication from "../../../hooks/use-message-publication";
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
  // A conversation with only yourself is the notes to self channel, gift wrapped to your own DM relays
  const isSelf = pubkey === account.pubkey;
  const location = useLocation();

  // Keep a subscription open for NIP-04 and NIP-17 messages
  const session = useMessaging();
  const conversation = useMemo(() => session?.legacy.conversation(pubkey), [session, pubkey]);
  use$(() => conversation?.watch$, [conversation]);

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

  // Read each side's NIP-04 messages from the inboxes of the recipient and the outboxes of the sender
  const loader = useMemo(() => conversation?.createTimelineLoader({ limit: 100 }), [conversation]);

  const legacyMessages = use$(() => conversation?.messages$, [conversation]);
  const wrappedMessages = use$(() => session?.wrapped.conversation(pubkey).timeline$({}), [session, pubkey]);
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
      } else if (message.kind === kinds.PrivateDirectMessage || message.kind === kinds.FileMessage) {
        const giftWrap = getRumorGiftWraps(message)[0];
        const ts = getExpirationTimestamp(message) ?? (giftWrap && getExpirationTimestamp(giftWrap));
        if (ts) return ts - message.created_at;
      }
    }
    return undefined;
  }, [messages]);

  const defaultMessageExpiration = use$(localSettings.defaultMessageExpiration);
  const initialType = !isSelf && lastReceivedMessage?.kind === kinds.EncryptedDirectMessage ? "nip04" : "nip17";
  const [type, setType] = useState<MessageType>(initialType);
  const publication = useMessagePublication(type, [pubkey]);
  useEffect(() => {
    if (!publication.pending && !publication.busy) setType(initialType);
  }, [initialType]);
  const [expiration, setExpiration] = useState<number | null>(lastExpiration ?? defaultMessageExpiration);
  useEffect(() => {
    if (lastExpiration) setExpiration(lastExpiration);
  }, [lastExpiration]);

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
            {isSelf ? <Text fontWeight="bold">Notes to self</Text> : <UserLink pubkey={pubkey} fontWeight="bold" />}
          </Flex>
        }
        actions={
          <ButtonGroup ml="auto">
            <ExpirationToggleButton value={expiration} onChange={setExpiration} variant="ghost" />
            {!isSelf && (
              <MessageTypeToggleButton
                value={type}
                onChange={setType}
                pubkey={pubkey}
                variant="ghost"
                isDisabled={!!publication.pending || publication.busy}
              />
            )}
            <DecryptLegacyMessagesButton other={pubkey} variant="ghost" />
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
          <ChatLog messages={messages} />
          {loader && <LoadMoreButton loader={loader} />}
        </Flex>

        <SendMessageForm
          flexShrink={0}
          pubkey={pubkey}
          p="2"
          type={type}
          publication={publication}
          expiration={expiration}
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

  return (
    <RequireActiveAccount>
      <DirectMessageChatRoute />
    </RequireActiveAccount>
  );
}

function DirectMessageChatRoute() {
  const account = useActiveAccount()!;
  const { pubkey } = useParamsProfilePointer();
  return <DirectMessageChatPage key={`${account.pubkey}:${pubkey}`} pubkey={pubkey} />;
}
