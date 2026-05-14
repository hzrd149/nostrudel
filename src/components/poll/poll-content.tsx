import { CheckIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Progress, Text, Tooltip, type FlexProps } from "@chakra-ui/react";
import { PollResponseFactory } from "applesauce-common/factories";
import { getPollEndsAt, getPollQuestion, getPollRelays, getPollType } from "applesauce-common/helpers";
import { getSeenRelays, mergeRelaySets } from "applesauce-core/helpers";
import { use$ , useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";

import { getAccountPollVote, getPollResults, POLL_RESPONSE_KIND } from "../../helpers/nostr/polls";
import useAsyncAction from "../../hooks/use-async-action";
import { useReadRelays } from "../../hooks/use-client-relays";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { eventStore } from "../../services/event-store";
import { pollResponseLoader } from "../../services/loaders";

export default function PollContent({
  event,
  readOnly,
  ...props
}: { event: NostrEvent; readOnly?: boolean } & Omit<FlexProps, "children">) {
  const account = useActiveAccount();
  const publish = usePublishEvent();
  const readRelays = useReadRelays(mergeRelaySets(getSeenRelays(event), getPollRelays(event)));
  const relayKey = readRelays.join("\n");
  const stableReadRelays = useMemo(() => readRelays, [relayKey]);
  const responseRelays = useMemo(
    () => mergeRelaySets(getPollRelays(event), getSeenRelays(event), stableReadRelays),
    [event, stableReadRelays],
  );
  const responseRelayKey = responseRelays.join("\n");

  useEffect(() => {
    if (readOnly) return;

    const sub = pollResponseLoader({ value: event.id, relays: responseRelays }).subscribe();
    return () => sub.unsubscribe();
  }, [event.id, responseRelayKey, readOnly]);

  const responses =
    use$(
      () => eventStore.timeline({ kinds: [POLL_RESPONSE_KIND], "#e": [event.id] }),
      [event.id, responseRelayKey],
    ) ?? [];

  const pollType = getPollType(event);
  const endsAt = getPollEndsAt(event);
  const isExpired = !!endsAt && endsAt < Math.floor(Date.now() / 1000);
  const { results, total } = useMemo(() => getPollResults(event, responses), [event, responses]);
  const selectedOptions = useMemo(
    () => getAccountPollVote(event, responses, account?.pubkey),
    [event, responses, account?.pubkey],
  );
  const [draftSelection, setDraftSelection] = useState<string[]>([]);

  const { loading, run: vote } = useAsyncAction(
    async (optionIds: string[]) => {
      if (readOnly || !account || optionIds.length === 0 || isExpired) return;

      const draft =
        pollType === "multiplechoice"
          ? PollResponseFactory.create(event, optionIds)
          : PollResponseFactory.single(event, optionIds[0]);
      await publish("Poll vote", await draft, responseRelays, false, true);
      setDraftSelection([]);
    },
    [readOnly, account, event, pollType, responseRelayKey, isExpired],
  );

  const toggleOption = (optionId: string) => {
    if (pollType === "singlechoice") {
      vote([optionId]);
      return;
    }

    setDraftSelection((current) =>
      current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId],
    );
  };

  const disabled = readOnly || !account || isExpired;

  return (
    <Flex direction="column" gap="3" {...props}>
      {getPollQuestion(event) && (
        <Box fontSize="md">
          <Text whiteSpace="pre-wrap">{getPollQuestion(event)}</Text>
        </Box>
      )}

      <Flex direction="column" gap="2">
        {results.map((option) => {
          const selected = selectedOptions.includes(option.id);
          const pending = draftSelection.includes(option.id);
          return (
            <Button
              key={option.id}
              position="relative"
              justifyContent="stretch"
              h="auto"
              minH="12"
              py="2"
              px="3"
              overflow="hidden"
              whiteSpace="normal"
              textAlign="left"
              colorScheme={selected || pending ? "primary" : undefined}
              variant={selected || pending ? "solid" : "outline"}
              isDisabled={disabled || (pollType === "singlechoice" && selected)}
              isLoading={loading && (pollType === "singlechoice" ? pending || !draftSelection.length : pending)}
              onClick={() => toggleOption(option.id)}
              zIndex={1}
            >
              <Progress
                value={option.percent}
                position="absolute"
                inset={0}
                h="full"
                opacity={selected || pending ? 0.18 : 0.12}
                colorScheme={selected || pending ? "primary" : "gray"}
                pointerEvents="none"
              />
              <Flex position="relative" w="full" gap="3" alignItems="center">
                {(selected || pending) && <CheckIcon flexShrink={0} />}
                <Text flex={1}>{option.label}</Text>
                <Tooltip label={option.count === 1 ? "1 vote" : `${option.count} votes`}>
                  <Text as="span" color={selected || pending ? "currentColor" : "gray.500"} whiteSpace="nowrap">
                    {option.percent}%
                  </Text>
                </Tooltip>
              </Flex>
            </Button>
          );
        })}
      </Flex>

      <Flex alignItems="center" gap="2">
        <Text color="gray.500" fontSize="sm">
          {total === 1 ? "1 vote" : `${total} votes`}
          {isExpired ? " · Poll ended" : pollType === "multiplechoice" ? " · Multiple choice" : ""}
        </Text>
        {pollType === "multiplechoice" && !readOnly && (
          <Button
            size="sm"
            colorScheme="primary"
            ml="auto"
            isDisabled={disabled || draftSelection.length === 0}
            isLoading={loading}
            onClick={() => vote(draftSelection)}
          >
            Submit vote
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
