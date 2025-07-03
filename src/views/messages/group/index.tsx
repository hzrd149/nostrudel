import { AvatarGroup, ButtonGroup, Flex, IconButton, Text } from "@chakra-ui/react";
import {
  createConversationIdentifier,
  getConversationParticipants,
  getExpirationTimestamp,
  getRumorGiftWraps,
  Rumor,
} from "applesauce-core/helpers";
import { useActiveAccount, useEventModel, useObservableState } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { memo, useCallback, useContext, useEffect, useMemo } from "react";
import { Navigate, UNSAFE_DataRouterContext, useLocation, useNavigate, useParams } from "react-router-dom";

import { GiftWrapsModel, WrappedMessagesGroup } from "applesauce-core/models";
import { SettingsIcon } from "../../../components/icons";
import SimpleView from "../../../components/layout/presets/simple-view";
import RequireActiveAccount from "../../../components/router/require-active-account";
import UserAvatar from "../../../components/user/user-avatar";
import UserLink from "../../../components/user/user-link";
import { normalizeToHexPubkey } from "../../../helpers/nip19";
import { groupMessages } from "../../../helpers/nostr/dms";
import useRouterMarker from "../../../hooks/use-router-marker";
import useScrollRestoreRef from "../../../hooks/use-scroll-restore";
import { DirectMessageRelays } from "../../../models/messages";
import { wrappedMessageSubscription } from "../../../services/lifecycle";
import DirectMessageGroup from "../components/direct-message-group";
import PendingLockedAlert from "../components/pending-decryption-alert";
import ReadAuthRequiredAlert from "../components/read-auth-required-alert";
import GroupMessageForm from "./components/group-message-form";
import GroupRelayConnectionsButton from "./components/group-relay-connections";
import GroupSettingsDrawer from "./components/group-settings-drawer";

/** This is broken out from DirectMessageGroupPage for performance reasons. Don't use outside of file */
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

const GroupReadAuthRequiredAlert = () => {
  const account = useActiveAccount()!;
  const inboxes = useEventModel(DirectMessageRelays, [account.pubkey]);

  return <ReadAuthRequiredAlert relays={inboxes ?? []} />;
};

function DirectMessageGroupPage({ group }: { group: string }) {
  const account = useActiveAccount()!;
  const navigate = useNavigate();
  const location = useLocation();

  // Keep a subscription open for NIP-17 messages
  useObservableState(wrappedMessageSubscription);

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

  const messages = useEventModel(WrappedMessagesGroup, [account.pubkey, others]) ?? [];
  const locked = useEventModel(GiftWrapsModel, [account.pubkey, true]);

  const lastExpiration = useMemo<number | undefined>(() => {
    for (const message of messages) {
      const giftWrap = getRumorGiftWraps(message)[0];
      const ts = getExpirationTimestamp(giftWrap);
      if (ts) return ts - message.created_at;
    }
    return undefined;
  }, [messages]);

  // restore scroll on navigation
  const scroll = useScrollRestoreRef();

  return (
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
      gap="0"
    >
      <Flex direction="column-reverse" gap="2" flexGrow={1} h={0} overflowX="hidden" overflowY="auto" ref={scroll}>
        <PendingLockedAlert />
        <ChatLog messages={messages} />
      </Flex>

      <GroupReadAuthRequiredAlert />
      <GroupMessageForm flexShrink={0} group={group} p="2" initialExpiration={lastExpiration} />

      <GroupSettingsDrawer isOpen={!!location.state?.settings} onClose={closeDrawer} group={group} />
    </SimpleView>
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
      <DirectMessageGroupPage group={groupId} />
    </RequireActiveAccount>
  );
}
