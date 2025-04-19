import { Button, Flex, FlexProps, Heading, Textarea } from "@chakra-ui/react";
import dayjs from "dayjs";
import { EventTemplate } from "nostr-tools";
import { useForm } from "react-hook-form";

import StarRating from "../../../components/star-rating";
import { RELAY_REVIEW_LABEL, RELAY_REVIEW_LABEL_NAMESPACE, REVIEW_KIND } from "../../../helpers/nostr/reviews";
import { usePublishEvent } from "../../../providers/global/publish-provider";

export default function RelayReviewForm({
  onClose,
  relay,
  ...props
}: { onClose: () => void; relay: string } & Omit<FlexProps, "children">) {
  const publish = usePublishEvent();
  const { register, getValues, watch, handleSubmit, setValue } = useForm({
    defaultValues: {
      quality: 0.6,
      content: "",
    },
  });

  watch("quality");

  const onSubmit = handleSubmit(async (values) => {
    const draft: EventTemplate = {
      kind: REVIEW_KIND,
      content: values.content,
      tags: [
        ["l", RELAY_REVIEW_LABEL, new URL(relay).host, JSON.stringify({ quality: values.quality })],
        ["L", RELAY_REVIEW_LABEL_NAMESPACE],
        ["r", relay],
      ],
      created_at: dayjs().unix(),
    };

    const pub = await publish("Review Relay", draft);
    if (pub) onClose();
  });

  return (
    <Flex as="form" direction="column" onSubmit={onSubmit} gap="2" mb="2" {...props}>
      <Flex gap="2">
        <Heading size="md">Write review</Heading>
        <StarRating
          quality={getValues().quality}
          fontSize="1.5rem"
          onChange={(q) => setValue("quality", q, { shouldDirty: true })}
        />
      </Flex>
      <Textarea {...register("content")} rows={5} placeholder="A short description of your experience with the relay" />
      <Flex gap="2" ml="auto">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" colorScheme="primary">
          Submit
        </Button>
      </Flex>
    </Flex>
  );
}
