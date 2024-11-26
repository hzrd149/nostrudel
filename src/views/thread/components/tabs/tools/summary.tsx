import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Flex, Spinner, Text, Textarea, useToast } from "@chakra-ui/react";
import { EventTemplate, NostrEvent } from "nostr-tools";
import { MultiSubscription } from "applesauce-net/subscription";
import { useStoreQuery } from "applesauce-react/hooks";
import { unixNow } from "applesauce-core/helpers";

import { useUserInbox } from "../../../../../hooks/use-user-mailboxes";
import useCurrentAccount from "../../../../../hooks/use-current-account";
import { usePublishEvent } from "../../../../../providers/global/publish-provider";
import relayPoolService from "../../../../../services/relay-pool";
import { eventStore } from "../../../../../services/event-store";
import DVMResponsesQuery from "../../../../../queries/dvm-responses";
import { DVMStatusCard } from "../../../../discovery/dvm-feed/components/feed-status";

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
  const account = useCurrentAccount();
  const inbox = useUserInbox(account?.pubkey);

  const newRequest = async (prompt: string) => {
    try {
      if (!inbox) throw new Error("Missing user inbox relays");

      const draft: EventTemplate = {
        kind: 5001,
        content: "",
        tags: [
          ["relays", ...inbox],
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

  useEffect(() => {
    if (!inbox || !request) return;

    const sub = new MultiSubscription(relayPoolService);
    sub.onEvent.subscribe((e) => eventStore.add(e));

    sub.setFilters([{ kinds: [7000, 6001], "#e": [request.id] }]);
    sub.setRelays(inbox);
    sub.open();

    return () => sub.close();
  }, [request]);

  const responses = useStoreQuery(DVMResponsesQuery, request ? [request] : undefined);

  return (
    <Flex direction="column" gap="2" px="2">
      {responses ? (
        <>
          {Object.entries(responses).map(([pubkey, event]) => (
            <DVMStatusCard status={event} />
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
