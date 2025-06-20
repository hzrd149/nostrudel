import { Flex, FlexProps, IconButton, IconButtonProps, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useCallback, useMemo, useState } from "react";

import { useActiveAccount, useEventFactory } from "applesauce-react/hooks";
import { getEventReactionScore, groupReactions } from "../../helpers/nostr/reactions";
import useEventReactions from "../../hooks/use-event-reactions";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay";
import { ChevronDownIcon, ChevronUpIcon, DislikeIcon, LikeIcon } from "../icons";

export default function EventVoteButtons({
  event,
  chevrons = true,
  inline = false,
  variant = "ghost",
  ...props
}: Omit<FlexProps, "children"> & {
  event: NostrEvent;
  chevrons?: boolean;
  inline?: boolean;
  variant?: IconButtonProps["variant"];
}) {
  const account = useActiveAccount();
  const publish = usePublishEvent();
  const reactions = useEventReactions(event);
  const additionalRelays = useAdditionalRelayContext();
  const factory = useEventFactory();

  const grouped = useMemo(() => groupReactions(reactions ?? []), [reactions]);
  const { vote, up, down } = getEventReactionScore(grouped);

  const hasUpVote = !!account && !!up?.pubkeys.includes(account.pubkey);
  const hasDownVote = !!account && !!down?.pubkeys.includes(account.pubkey);

  const [loading, setLoading] = useState(false);
  const addVote = useCallback(
    async (vote: string) => {
      setLoading(true);
      const draft = await factory.reaction(event, vote);
      await publish("Vote", draft, additionalRelays);
      setLoading(false);
    },
    [event, publish, additionalRelays, factory],
  );

  const upIcon = chevrons ? <ChevronUpIcon boxSize={6} /> : <LikeIcon />;
  const downIcon = chevrons ? <ChevronDownIcon boxSize={6} /> : <DislikeIcon />;

  return (
    <Flex flexDirection={inline ? "row" : "column"} alignItems="center" {...props}>
      <IconButton
        aria-label="up vote"
        title="up vote"
        icon={upIcon}
        size="sm"
        variant={hasUpVote ? "solid" : variant}
        isLoading={loading}
        onClick={() => addVote("+")}
        isDisabled={!account || !!hasUpVote || !!hasDownVote}
        colorScheme={hasUpVote ? "primary" : "gray"}
      />
      {(up || down) && vote > 0 && (
        <Text p="2" lineHeight="1em">
          {vote}
        </Text>
      )}
      <IconButton
        aria-label="down vote"
        title="down vote"
        icon={downIcon}
        size="sm"
        variant={hasDownVote ? "solid" : variant}
        isLoading={loading}
        onClick={() => addVote("-")}
        isDisabled={!account || !!hasUpVote || !!hasDownVote}
        colorScheme={hasDownVote ? "primary" : "gray"}
      />
    </Flex>
  );
}
