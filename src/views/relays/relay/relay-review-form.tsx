import { Button, Flex, Heading, Textarea, useToast } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";

import { useWriteRelayUrls } from "../../../hooks/use-client-relays";
import StarRating from "../../../components/star-rating";
import { DraftNostrEvent } from "../../../types/nostr-event";
import { RELAY_REVIEW_LABEL, RELAY_REVIEW_LABEL_NAMESPACE, REVIEW_KIND } from "../../../helpers/nostr/reviews";
import { useSigningContext } from "../../../providers/signing-provider";
import NostrPublishAction from "../../../classes/nostr-publish-action";

export default function RelayReviewForm({ onClose, relay }: { onClose: () => void; relay: string }) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const writeRelays = useWriteRelayUrls();
  const { register, getValues, watch, handleSubmit, setValue } = useForm({
    defaultValues: {
      quality: 0.6,
      content: "",
    },
  });

  watch("quality");

  const onSubmit = handleSubmit(async (values) => {
    try {
      const draft: DraftNostrEvent = {
        kind: REVIEW_KIND,
        content: values.content,
        tags: [
          ["l", RELAY_REVIEW_LABEL, new URL(relay).host, JSON.stringify({ quality: values.quality })],
          ["L", RELAY_REVIEW_LABEL_NAMESPACE],
          ["r", relay],
        ],
        created_at: dayjs().unix(),
      };

      const signed = await requestSignature(draft);
      const pub = new NostrPublishAction("Review Relay", writeRelays, signed);
      onClose();
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  });

  return (
    <Flex as="form" direction="column" onSubmit={onSubmit} gap="2" mb="2">
      <Flex gap="2">
        <Heading size="md">Write review</Heading>
        <StarRating quality={getValues().quality} fontSize="1.5rem" onChange={(q) => setValue("quality", q)} />
      </Flex>
      <Textarea {...register("content")} rows={5} placeholder="A short description of your experience with the relay" />
      <Flex gap="2" ml="auto">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" colorScheme="brand">
          Submit
        </Button>
      </Flex>
    </Flex>
  );
}
