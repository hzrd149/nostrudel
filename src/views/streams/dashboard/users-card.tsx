import { memo, useMemo } from "react";
import { Button, ButtonGroup, Divider, Flex, Heading } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { useActiveAccount } from "applesauce-react/hooks";
import useStreamChatTimeline from "../stream/stream-chat/use-stream-chat-timeline";
import UserAvatar from "../../../components/user/user-avatar";
import UserLink from "../../../components/user/user-link";
import useUserMuteActions from "../../../hooks/use-user-mute-actions";
import { useMuteModalContext } from "../../../providers/route/mute-modal-provider";
import useUserMutes from "../../../hooks/use-user-mutes";

function UserCard({ pubkey }: { pubkey: string }) {
  const { isMuted, unmute, canUnmute, unmuting } = useUserMuteActions(pubkey);
  const { openModal } = useMuteModalContext();

  return (
    <Flex gap="2" direction="row" alignItems="center">
      {!isMuted && <UserAvatar pubkey={pubkey} noProxy size="sm" />}
      <UserLink pubkey={pubkey} />
      <ButtonGroup ml="auto">
        {isMuted ? (
          <Button onClick={unmute} isDisabled={!canUnmute} isLoading={unmuting}>
            Unmute
          </Button>
        ) : (
          <Button onClick={() => openModal(pubkey)}>Mute</Button>
        )}
      </ButtonGroup>
    </Flex>
  );
}

function UsersCard({ stream }: { stream: NostrEvent }) {
  const account = useActiveAccount()!;
  const { timeline: chatEvents } = useStreamChatTimeline(stream);

  const mutes = useUserMutes(account.pubkey);
  const pubkeysInChat = useMemo(() => {
    const pubkeys: string[] = [];
    for (const event of chatEvents) {
      if (!pubkeys.includes(event.pubkey)) pubkeys.push(event.pubkey);
    }
    return pubkeys;
  }, [chatEvents]);

  const peopleInChat = pubkeysInChat.filter((pubkey) => !mutes?.pubkeys.has(pubkey));
  const mutedPubkeys = pubkeysInChat.filter((pubkey) => mutes?.pubkeys.has(pubkey));

  return (
    <Flex flex={1} p="2" gap="2" display="flex" overflowY="auto" overflowX="hidden" flexDirection="column">
      {peopleInChat.map((pubkey) => (
        <UserCard key={pubkey} pubkey={pubkey} />
      ))}
      {mutedPubkeys.length > 0 && (
        <>
          <Heading size="sm">Muted</Heading>
          <Divider />
          {mutedPubkeys.map((pubkey) => (
            <UserCard key={pubkey} pubkey={pubkey} />
          ))}
        </>
      )}
    </Flex>
  );
}

export default memo(UsersCard);
