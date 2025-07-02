import { AvatarGroup, Button, ButtonGroup, Flex, IconButton, Text } from "@chakra-ui/react";
import {
  createConversationIdentifier,
  getConversationParticipants,
  isGiftWrapLocked,
  mergeRelaySets,
  Rumor,
  unlockGiftWrap,
} from "applesauce-core/helpers";
import { useActiveAccount, useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { memo, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { Navigate, UNSAFE_DataRouterContext, useLocation, useNavigate, useParams } from "react-router-dom";

import { GiftWrapsModel, WrappedMessagesGroup } from "applesauce-core/models";
import SimpleView from "../../../components/layout/presets/simple-view";
import RequireActiveAccount from "../../../components/router/require-active-account";
import TimelineActionAndStatus from "../../../components/timeline/timeline-action-and-status";
import UserAvatar from "../../../components/user/user-avatar";
import UserLink from "../../../components/user/user-link";
import { normalizeToHexPubkey } from "../../../helpers/nip19";
import { groupMessages } from "../../../helpers/nostr/dms";
import useAsyncAction from "../../../hooks/use-async-action";
import useRouterMarker from "../../../hooks/use-router-marker";
import useScrollRestoreRef from "../../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import { DirectMessageRelays } from "../../../models/messages";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import localSettings from "../../../services/local-settings";
import DirectMessageGroup from "../components/direct-message-group";
import PendingLockedAlert from "../components/pending-decryption-alert";
import GroupMessageForm from "./components/group-message-form";
import GroupSettingsDrawer from "./components/group-settings-drawer";
import { SettingsIcon } from "../../../components/icons";
import GroupRelayConnectionsButton from "./components/group-relay-connections";

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

function DirectMessageChatPage({ group }: { group: string }) {
  const account = useActiveAccount()!;
  const navigate = useNavigate();
  const location = useLocation();
  const autoDecryptMessages = useObservableEagerState(localSettings.autoDecryptMessages);

  const { router } = useContext(UNSAFE_DataRouterContext)!;
  const marker = useRouterMarker(router);
  useEffect(() => {
    if (marker.index.current === null) {
      // the drawer just open, set the marker
      marker.set(1);
    }
  }, [location]);

  const openSettings = useCallback(() => {
    marker.set(0);
    navigate(".", { state: { settings: true } });
  }, [navigate]);

  const closeDrawer = useCallback(() => {
    if (marker.index.current !== null && marker.index.current > 0) {
      navigate(-marker.index.current);
    } else navigate(".", { state: { settings: undefined } });
    marker.reset();
  }, [marker, navigate]);

  const pubkeys = useMemo(() => getConversationParticipants(group), [group]);
  const others = useMemo(() => pubkeys.filter((p) => p !== account.pubkey), [pubkeys, account.pubkey]);

  const mailboxes = useUserMailboxes(account.pubkey);
  const dmRelays = useEventModel(DirectMessageRelays, [account.pubkey]);
  const { loader } = useTimelineLoader(`${group}-messages`, mergeRelaySets(dmRelays, mailboxes?.inboxes), [
    { kinds: [kinds.EncryptedDirectMessage], "#p": pubkeys, authors: pubkeys },
  ]);

  const messages = useEventModel(WrappedMessagesGroup, [account.pubkey, others]) ?? [];
  const locked = useEventModel(GiftWrapsModel, [account.pubkey, true]);

  // Action to decrypt all messages
  const pending = useRef<Set<string>>(new Set());
  const decryptAll = useAsyncAction(async () => {
    if (!locked) return;

    for (const giftWrap of locked) {
      if (isGiftWrapLocked(giftWrap) && !pending.current.has(giftWrap.id)) {
        pending.current.add(giftWrap.id);
        unlockGiftWrap(giftWrap, account).finally(() => pending.current.delete(giftWrap.id));
      }
    }
  }, [locked, account]);

  // Callback to timeline loading
  const callback = useTimelineCurserIntersectionCallback(loader);

  // restore scroll on navigation
  const scroll = useScrollRestoreRef();

  return (
    <IntersectionObserverProvider callback={callback}>
      <SimpleView
        title={
          <Flex gap="2" alignItems="center">
            <AvatarGroup size="sm">
              {others.map((pubkey) => (
                <UserAvatar key={pubkey} pubkey={pubkey} />
              ))}
            </AvatarGroup>
            <Text fontWeight="bold" isTruncated>
              {others.map((p, i) => (
                <>
                  <UserLink key={p} pubkey={p} />
                  {i < others.length - 1 && <span>, </span>}
                </>
              ))}
            </Text>
          </Flex>
        }
        actions={
          <ButtonGroup ml="auto">
            {!autoDecryptMessages && (
              <Button onClick={decryptAll.run} isLoading={decryptAll.loading}>
                Decrypt All
              </Button>
            )}
            <GroupRelayConnectionsButton group={group} variant="ghost" onClick={openSettings} />
            <IconButton
              aria-label="Settings"
              title="Group settings"
              icon={<SettingsIcon boxSize={5} />}
              onClick={openSettings}
              variant="ghost"
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

        <GroupMessageForm flexShrink={0} group={group} px="2" pb="2" />

        <GroupSettingsDrawer isOpen={!!location.state?.settings} onClose={closeDrawer} group={group} />
      </SimpleView>
    </IntersectionObserverProvider>
  );
}

export default function DirectMessageGroupView() {
  const account = useActiveAccount();
  const { group } = useParams();
  if (!group) return <Navigate to="/messages" />;

  const groupId = useMemo(() => {
    const pubkeys = group
      .split(":")
      .map(normalizeToHexPubkey)
      .filter((p) => !!p) as string[];
    if (account) pubkeys.push(account.pubkey);
    return createConversationIdentifier(pubkeys);
  }, [group]);

  return (
    <RequireActiveAccount>
      <DirectMessageChatPage group={groupId} />
    </RequireActiveAccount>
  );
}
