import { useCallback, useMemo, useState } from "react";
import { Flex, FlexProps, IconButton, IconButtonProps, Text } from "@chakra-ui/react";

import { ChevronDownIcon, ChevronUpIcon, DislikeIcon, LikeIcon } from "../icons";
import useCurrentAccount from "../../hooks/use-current-account";
import useEventReactions from "../../hooks/use-event-reactions";
import { draftEventReaction, getEventReactionScore, groupReactions } from "../../helpers/nostr/reactions";
import { NostrEvent } from "../../types/nostr-event";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import { usePublishEvent } from "../../providers/global/publish-provider";

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
  const account = useCurrentAccount();
  const publish = usePublishEvent();
  const reactions = useEventReactions(event);
  const additionalRelays = useAdditionalRelayContext();

  const grouped = useMemo(() => groupReactions(reactions ?? []), [reactions]);
  const { vote, up, down } = getEventReactionScore(grouped);

  const hasUpVote = !!account && !!up?.pubkeys.includes(account.pubkey);
  const hasDownVote = !!account && !!down?.pubkeys.includes(account.pubkey);

  const [loading, setLoading] = useState(false);
  const addVote = useCallback(
    async (vote: string) => {
      setLoading(true);
      const draft = draftEventReaction(event, vote);
      await publish("Reaction", draft, additionalRelays);
      setLoading(false);
    },
    [event, publish, additionalRelays],
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
