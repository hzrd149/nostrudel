import { useCallback, useMemo, useState } from "react";
import { Card, CardProps, IconButton, Text, useToast } from "@chakra-ui/react";

import useCurrentAccount from "../../../hooks/use-current-account";
import useEventReactions from "../../../hooks/use-event-reactions";
import { useSigningContext } from "../../../providers/signing-provider";
import { draftEventReaction, groupReactions } from "../../../helpers/nostr/reactions";
import clientRelaysService from "../../../services/client-relays";
import { getCommunityPostVote } from "../../../helpers/nostr/communities";
import { unique } from "../../../helpers/array";
import eventReactionsService from "../../../services/event-reactions";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";
import { NostrEvent } from "../../../types/nostr-event";
import { useAdditionalRelayContext } from "../../../providers/additional-relay-context";

export default function PostVoteButtons({ event, ...props }: Omit<CardProps, "children"> & { event: NostrEvent }) {
  const account = useCurrentAccount();
  const reactions = useEventReactions(event.id);
  const toast = useToast();
  const additionalRelays = useAdditionalRelayContext();

  const grouped = useMemo(() => groupReactions(reactions ?? []), [reactions]);
  const { vote, up, down } = getCommunityPostVote(grouped);

  const hasUpVote = !!account && !!up?.pubkeys.includes(account.pubkey);
  const hasDownVote = !!account && !!down?.pubkeys.includes(account.pubkey);

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
          new NostrPublishAction("Reaction", unique([...writeRelays, ...additionalRelays]), signed);
          eventReactionsService.handleEvent(signed);
        }
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setLoading(false);
    },
    [event, requestSignature, additionalRelays],
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
