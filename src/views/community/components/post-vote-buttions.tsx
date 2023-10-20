import { useCallback, useMemo, useState } from "react";
import { Card, IconButton, Text, useToast } from "@chakra-ui/react";

import { useCurrentAccount } from "../../../hooks/use-current-account";
import useEventReactions from "../../../hooks/use-event-reactions";
import { useSigningContext } from "../../../providers/signing-provider";
import { draftEventReaction, groupReactions } from "../../../helpers/nostr/reactions";
import clientRelaysService from "../../../services/client-relays";
import { getCommunityRelays } from "../../../helpers/nostr/communities";
import { unique } from "../../../helpers/array";
import eventReactionsService from "../../../services/event-reactions";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";
import { NostrEvent } from "../../../types/nostr-event";

export default function PostVoteButtons({ event, community }: { event: NostrEvent; community: NostrEvent }) {
  const account = useCurrentAccount();
  const reactions = useEventReactions(event.id);
  const toast = useToast();

  const grouped = useMemo(() => groupReactions(reactions ?? []), [reactions]);
  const up = grouped.find((r) => r.emoji === "+");
  const down = grouped.find((r) => r.emoji === "-");
  const vote = (up?.pubkeys.length ?? 0) - (down?.pubkeys.length ?? 0);

  const myVote = reactions?.find((e) => e.pubkey === account?.pubkey);

  const { requestSignature } = useSigningContext();
  const [loading, setLoading] = useState(false);
  const addVote = useCallback(
    async (vote: string) => {
      setLoading(true);
      try {
        const draft = draftEventReaction(event, vote);

        const signed = await requestSignature(draft);
        if (signed) {
          const writeRelays = clientRelaysService.getWriteUrls();
          const communityRelays = getCommunityRelays(community);
          new NostrPublishAction("Reaction", unique([...writeRelays, ...communityRelays]), signed);
          eventReactionsService.handleEvent(signed);
        }
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setLoading(false);
    },
    [event, community, requestSignature],
  );

  return (
    <Card direction="column" alignItems="center" borderRadius="lg">
      <IconButton
        aria-label="up vote"
        title="up vote"
        icon={<ChevronUpIcon boxSize={6} />}
        size="sm"
        variant={myVote?.content === "+" ? "solid" : "ghost"}
        isLoading={loading}
        onClick={() => addVote("+")}
        isDisabled={!account || !!myVote}
        colorScheme={myVote ? "primary" : "gray"}
      />
      {(up || down) && <Text my="1">{vote}</Text>}
      <IconButton
        aria-label="down vote"
        title="down vote"
        icon={<ChevronDownIcon boxSize={6} />}
        size="sm"
        variant={myVote?.content === "-" ? "solid" : "ghost"}
        isLoading={loading}
        onClick={() => addVote("-")}
        isDisabled={!account || !!myVote}
      />
    </Card>
  );
}
