import { Box, Flex, Spacer, Text } from "@chakra-ui/react";
import { Zap } from "applesauce-common/casts";
import { KnownEvent } from "applesauce-core/helpers";
import { getZapPayment } from "applesauce-common/helpers";
import { kinds, NostrEvent } from "nostr-tools";

import { LightningIcon } from "../../../components/icons";
import TextNoteContents from "../../../components/timeline/note/text-note-contents";
import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { humanReadableSats } from "../../../helpers/lightning";
import { getGoalRelays } from "../../../helpers/nostr/goal";
import useCastEvent from "../../../hooks/use-cast-event";
import useEventZaps from "../../../hooks/use-event-zaps";

function GoalZap({ zap }: { zap: KnownEvent<kinds.Zap> }) {
  const cast = useCastEvent(zap, Zap);
  if (!cast?.amount) return null;

  return (
    <Flex gap="2">
      <UserAvatarLink pubkey={cast.sender.pubkey} size="md" />
      <Box>
        <Text>
          <UserLink fontSize="lg" fontWeight="bold" pubkey={cast.sender.pubkey} mr="2" />
          <Timestamp timestamp={zap.created_at} />
        </Text>
        {cast.request.content && <TextNoteContents event={cast.request} />}
      </Box>
      <Spacer />
      <Text>
        <LightningIcon /> {humanReadableSats(cast.amount / 1000)}
      </Text>
    </Flex>
  );
}

export default function GoalZapList({ goal }: { goal: NostrEvent }) {
  const zaps = useEventZaps(goal, getGoalRelays(goal));

  return (
    <>
      {zaps.map((zap) => (
        <GoalZap key={zap.id} zap={zap} />
      ))}
    </>
  );
}
