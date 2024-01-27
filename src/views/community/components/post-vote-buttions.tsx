import { useCallback, useMemo, useState } from "react";
import { Card, CardProps, IconButton, Text } from "@chakra-ui/react";

import useCurrentAccount from "../../../hooks/use-current-account";
import useEventReactions from "../../../hooks/use-event-reactions";
import { draftEventReaction, groupReactions } from "../../../helpers/nostr/reactions";
import { getCommunityPostVote } from "../../../helpers/nostr/communities";
import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";
import { NostrEvent } from "../../../types/nostr-event";
import { useAdditionalRelayContext } from "../../../providers/local/additional-relay-context";
import { usePublishEvent } from "../../../providers/global/publish-provider";

export default function PostVoteButtons({ event, ...props }: Omit<CardProps, "children"> & { event: NostrEvent }) {
  const account = useCurrentAccount();
  const publish = usePublishEvent();
  const reactions = useEventReactions(event.id);
  const additionalRelays = useAdditionalRelayContext();

  const grouped = useMemo(() => groupReactions(reactions ?? []), [reactions]);
  const { vote, up, down } = getCommunityPostVote(grouped);

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

  return (
    <Card direction="column" alignItems="center" borderRadius="lg" {...props}>
      <IconButton
        aria-label="up vote"
        title="up vote"
        icon={<ChevronUpIcon boxSize={6} />}
        size="sm"
        variant={hasUpVote ? "solid" : "ghost"}
        isLoading={loading}
        onClick={() => addVote("+")}
        isDisabled={!account || !!hasUpVote || !!hasDownVote}
        colorScheme={hasUpVote ? "primary" : "gray"}
      />
      {(up || down) && <Text my="1">{vote}</Text>}
      <IconButton
        aria-label="down vote"
        title="down vote"
        icon={<ChevronDownIcon boxSize={6} />}
        size="sm"
        variant={hasDownVote ? "solid" : "ghost"}
        isLoading={loading}
        onClick={() => addVote("-")}
        isDisabled={!account || !!hasUpVote || !!hasDownVote}
        colorScheme={hasDownVote ? "primary" : "gray"}
      />
    </Card>
  );
}
