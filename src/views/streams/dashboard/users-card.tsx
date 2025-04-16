import { ReactNode, memo, useMemo, useState } from "react";
import { useInterval } from "react-use";
import { Button, ButtonGroup, Divider, Flex, Heading } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import dayjs from "dayjs";

import { useActiveAccount } from "applesauce-react/hooks";
import useStreamChatTimeline from "../stream/stream-chat/use-stream-chat-timeline";
import UserAvatar from "../../../components/user/user-avatar";
import UserLink from "../../../components/user/user-link";
import useUserMuteActions from "../../../hooks/use-user-mute-actions";
import { useMuteModalContext } from "../../../providers/route/mute-modal-provider";
import useUserMuteList from "../../../hooks/use-user-mute-list";
import { isPubkeyInList } from "../../../helpers/nostr/lists";

function Countdown({ time }: { time: number }) {
  const [now, setNow] = useState(dayjs().unix());
  useInterval(() => setNow(dayjs().unix()), 1000);

  return <span>{time - now + "s"}</span>;
}

function UserCard({ pubkey }: { pubkey: string }) {
  const { isMuted, mute, unmute, expiration } = useUserMuteActions(pubkey);
  const { openModal } = useMuteModalContext();

  let buttons: ReactNode | null = null;
  if (isMuted) {
    if (expiration === Infinity) {
      buttons = <Button onClick={unmute}>Unban</Button>;
    } else {
      buttons = (
        <Button onClick={unmute}>
          Unmute (<Countdown time={expiration} />)
        </Button>
      );
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
}

function UsersCard({ stream }: { stream: NostrEvent }) {
  const account = useActiveAccount()!;
  const { timeline: chatEvents } = useStreamChatTimeline(stream);

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
