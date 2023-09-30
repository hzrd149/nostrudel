import { ReactNode, memo, useMemo } from "react";
import { Button, ButtonGroup, Divider, Flex, Heading } from "@chakra-ui/react";
import dayjs from "dayjs";

import useSubject from "../../../hooks/use-subject";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import useStreamChatTimeline from "../../streams/stream/stream-chat/use-stream-chat-timeline";
import { UserAvatar } from "../../../components/user-avatar";
import { UserLink } from "../../../components/user-link";
import useUserMuteFunctions from "../../../hooks/use-user-mute-functions";
import { useMuteModalContext } from "../../../providers/mute-modal-provider";
import useUserMuteList from "../../../hooks/use-user-mute-list";
import { isPubkeyInList } from "../../../helpers/nostr/lists";
import { DashboardCardProps } from "./common";

const UserCard = ({ pubkey }: { pubkey: string }) => {
  const { isMuted, mute, unmute, expiration } = useUserMuteFunctions(pubkey);
  const { openModal } = useMuteModalContext();

  let buttons: ReactNode | null = null;
  if (isMuted) {
    if (expiration === Infinity) {
      buttons = <Button onClick={unmute}>Unban</Button>;
    } else {
      buttons = <Button onClick={unmute}>Unmute ({dayjs.unix(expiration).fromNow()})</Button>;
    }
  } else {
    buttons = (
      <>
        <Button onClick={() => openModal(pubkey)}>Mute</Button>
        <Button onClick={mute}>Ban</Button>
      </>
    );
  }

  return (
    <Flex gap="2" direction="row" alignItems="center">
      {!isMuted && <UserAvatar pubkey={pubkey} noProxy size="sm" />}
      <UserLink pubkey={pubkey} />
      <ButtonGroup size="sm" ml="auto">
        {buttons}
      </ButtonGroup>
    </Flex>
  );
};

function UsersCard({ stream, ...props }: DashboardCardProps) {
  const account = useCurrentAccount()!;
  const streamChatTimeline = useStreamChatTimeline(stream);

  // refresh when a new event
  useSubject(streamChatTimeline.events.onEvent);
  const chatEvents = streamChatTimeline.events.getSortedEvents();

  const muteList = useUserMuteList(account.pubkey);
  const pubkeysInChat = useMemo(() => {
    const pubkeys: string[] = [];
    for (const event of chatEvents) {
      if (!pubkeys.includes(event.pubkey)) pubkeys.push(event.pubkey);
    }
    return pubkeys;
  }, [chatEvents]);

  const peopleInChat = pubkeysInChat.filter((pubkey) => !isPubkeyInList(muteList, pubkey));
  const mutedPubkeys = pubkeysInChat.filter((pubkey) => isPubkeyInList(muteList, pubkey));

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
