import { CheckIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Progress, Text, Tooltip, useToast, type FlexProps } from "@chakra-ui/react";
import { ReactionFactory } from "applesauce-common/factories";
import { getSeenRelays } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";

import { getAccountPollVote, getPollResults } from "../../helpers/nostr/polls";
import useEventReactions from "../../hooks/use-event-reactions";
import { useReadRelays } from "../../hooks/use-client-relays";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { reactionsLoader } from "../../services/loaders";
import TextNoteContents from "../timeline/note/text-note-contents";

export default function ZaplessPollContent({
  event,
  readOnly,
  ...props
}: { event: NostrEvent; readOnly?: boolean } & Omit<FlexProps, "children">) {
  const toast = useToast();
  const account = useActiveAccount();
  const publish = usePublishEvent();
  const readRelays = useReadRelays(getSeenRelays(event));
  const relayKey = readRelays.join("\n");
  const stableReadRelays = useMemo(() => readRelays, [relayKey]);
  const reactions = useEventReactions(readOnly ? undefined : event, stableReadRelays) ?? [];
  const [loadingOption, setLoadingOption] = useState<string>();

  useEffect(() => {
    if (readOnly) return;

    const sub = reactionsLoader(event, stableReadRelays).subscribe();
    return () => sub.unsubscribe();
  }, [event, relayKey, readOnly]);

  const { results, total } = useMemo(() => getPollResults(event, reactions), [event, reactions]);
  const selectedOption = useMemo(
    () => getAccountPollVote(event, reactions, account?.pubkey),
    [event, reactions, account?.pubkey],
  );

  const vote = async (optionId: string) => {
    if (readOnly || !account || selectedOption === optionId) return;

    setLoadingOption(optionId);
    try {
      const draft = await ReactionFactory.create(event, optionId);
      await publish("Poll vote", draft);
      reactionsLoader(event, stableReadRelays).subscribe();
    } catch (error) {
      if (error instanceof Error) toast({ description: error.message, status: "error" });
    } finally {
      setLoadingOption(undefined);
    }
  };

  return (
    <Flex direction="column" gap="3" {...props}>
      {event.content && (
        <Box fontSize="md">
          <TextNoteContents event={event} />
        </Box>
      )}

      <Flex direction="column" gap="2">
        {results.map((option) => {
          const selected = selectedOption === option.id;
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
              colorScheme={selected ? "primary" : undefined}
              variant={selected ? "solid" : "outline"}
              isDisabled={readOnly || !account || selected}
              isLoading={loadingOption === option.id}
              onClick={() => vote(option.id)}
            >
              <Progress
                value={option.percent}
                position="absolute"
                inset={0}
                h="full"
                opacity={selected ? 0.18 : 0.12}
                colorScheme={selected ? "primary" : "gray"}
                pointerEvents="none"
              />
              <Flex position="relative" zIndex={1} w="full" gap="3" alignItems="center">
                {selected && <CheckIcon flexShrink={0} />}
                <Text flex={1}>{option.label}</Text>
                <Tooltip label={option.count === 1 ? "1 vote" : `${option.count} votes`}>
                  <Text as="span" color={selected ? "currentColor" : "gray.500"} whiteSpace="nowrap">
                    {option.percent}%
                  </Text>
                </Tooltip>
              </Flex>
            </Button>
          );
        })}
      </Flex>

      <Text color="gray.500" fontSize="sm">
        {total === 1 ? "1 vote" : `${total} votes`}
      </Text>
    </Flex>
  );
}