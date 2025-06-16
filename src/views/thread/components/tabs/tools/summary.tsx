import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Flex, Spinner, Text, Textarea, useToast } from "@chakra-ui/react";
import { EventTemplate, NostrEvent } from "nostr-tools";
import { getEventUID, unixNow } from "applesauce-core/helpers";

import { usePublishEvent } from "../../../../../providers/global/publish-provider";
import { DVMResponsesModel } from "../../../../../models/dvm-responses";
import { DVMStatusCard } from "../../../../discovery/dvm-feed/components/feed-status";
import useSimpleSubscription from "../../../../../hooks/use-forward-subscription";
import { useReadRelays } from "../../../../../hooks/use-client-relays";
import { useEventModel } from "applesauce-react/hooks";

function PromptForm({ onSubmit }: { onSubmit: (prompt: string) => void | Promise<void> }) {
  const { register, handleSubmit } = useForm({ defaultValues: { prompt: "" } });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values.prompt);
  });

  return (
    <Flex gap="2" direction="column" as="form" onSubmit={submit}>
      <Textarea {...register("prompt")} placeholder="Prompt an AI model to summarize note" />
      <Button ml="auto" type="submit" size="sm" colorScheme="primary">
        Summarize
      </Button>
    </Flex>
  );
}

export default function EventSummarizePage({ event }: { event: NostrEvent }) {
  const toast = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [request, setRequest] = useState<NostrEvent>();

  const publish = usePublishEvent();
  const relays = useReadRelays();

  const newRequest = async (prompt: string) => {
    try {
      if (relays.length) throw new Error("Missing relays");

      const draft: EventTemplate = {
        kind: 5001,
        content: "",
        tags: [
          ["relays", ...relays],
          ["i", event.id, "event"],
          ["output", "text/plain"],
        ],
        created_at: unixNow(),
      };

      // add human prompt
      if (prompt) draft.tags.unshift(["i", prompt, "text"]);

      const pub = await publish("Summarize Event", draft);
      setRequest(pub?.event);
      setSubmitted(true);
    } catch (error) {
      if (error instanceof Error) toast({ description: error.message, status: "error" });
    }
  };

  // subscribe to dvm responses
  useSimpleSubscription(relays, request ? { kinds: [7000, 6001], "#e": [request.id] } : undefined);

  const responses = useEventModel(DVMResponsesModel, request ? [request] : undefined);

  return (
    <Flex direction="column" gap="2" px="2">
      {responses ? (
        <>
          {Object.entries(responses).map(([pubkey, event]) => (
            <DVMStatusCard key={getEventUID(event)} status={event} />
          ))}
        </>
      ) : submitted ? (
        <Text>
          <Spinner /> Waiting for responses...
        </Text>
      ) : (
        <PromptForm onSubmit={newRequest} />
      )}
    </Flex>
  );
}
