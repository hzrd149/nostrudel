import { Button, Flex, FlexProps, Heading, Textarea } from "@chakra-ui/react";
import dayjs from "dayjs";
import { EventTemplate } from "nostr-tools";
import { useState } from "react";

import StarRating from "../../../../components/star-rating";
import { RELAY_REVIEW_LABEL, RELAY_REVIEW_LABEL_NAMESPACE, REVIEW_KIND } from "../../../../helpers/nostr/reviews";
import useAsyncAction from "../../../../hooks/use-async-action";
import { usePublishEvent } from "../../../../providers/global/publish-provider";

export default function RelayReviewForm({
  onClose,
  relay,
  ...props
}: { onClose: () => void; relay: string } & Omit<FlexProps, "children">) {
  const publish = usePublishEvent();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");

  const onSubmit = useAsyncAction(async (e: React.FormEvent<any>) => {
    e.preventDefault();
    const draft: EventTemplate = {
      kind: REVIEW_KIND,
      content: content,
      tags: [
        ["l", RELAY_REVIEW_LABEL, new URL(relay).host, JSON.stringify({ quality: rating })],
        ["L", RELAY_REVIEW_LABEL_NAMESPACE],
        ["r", relay],
      ],
      created_at: dayjs().unix(),
    };

    const pub = await publish("Review Relay", draft);
    if (pub) onClose();
  });

  return (
    <Flex as="form" direction="column" onSubmit={onSubmit.run} gap="2" mb="2" {...props}>
      <Flex gap="2">
        <Heading size="md">Write review</Heading>
        <StarRating quality={rating} boxSize="6" onChange={(q) => setRating(q)} color="primary.500" />
      </Flex>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        placeholder="A short description of your experience with the relay"
      />
      <Flex gap="2" ml="auto">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" colorScheme="primary" isLoading={onSubmit.loading}>
          Submit
        </Button>
      </Flex>
    </Flex>
  );
}
