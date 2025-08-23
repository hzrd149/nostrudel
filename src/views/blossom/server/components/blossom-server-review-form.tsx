import { Button, Flex, FlexProps, Heading, Textarea } from "@chakra-ui/react";
import { includeSingletonTag } from "applesauce-factory/operations";
import { useState } from "react";

import { useEventFactory } from "applesauce-react/hooks";
import StarRating from "../../../../components/star-rating";
import useAsyncAction from "../../../../hooks/use-async-action";
import { usePublishEvent } from "../../../../providers/global/publish-provider";
import { BLOSSOM_SERVER_REVIEW_KIND } from "../tabs/reviews";

export type BlossomServerReviewFormProps = FlexProps & {
  server: string;
  onClose: () => void;
};

export default function BlossomServerReviewForm({ server, onClose, ...props }: BlossomServerReviewFormProps) {
  const publish = usePublishEvent();
  const factory = useEventFactory();
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0.6); // 0-5 stars for UI

  const submitReview = useAsyncAction(async (e: React.FormEvent<any>) => {
    e.preventDefault();
    if (!content.trim()) return;

    const draft = await factory.build(
      {
        kind: BLOSSOM_SERVER_REVIEW_KIND,
        content: content.trim(),
      },
      includeSingletonTag(["d", server]),
      includeSingletonTag(["rating", rating.toFixed(1)]),
    );

    await publish("Submit Review", draft);
    onClose();
  });

  return (
    <Flex as="form" direction="column" onSubmit={submitReview.run} gap="2" mb="2" {...props}>
      <Flex gap="2">
        <Heading size="md">Write review</Heading>
        <StarRating quality={rating} boxSize="6" onChange={setRating} color="primary.500" />
      </Flex>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        placeholder="Share your experience with this Blossom server..."
      />
      <Flex gap="2" ml="auto">
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" colorScheme="primary" isLoading={submitReview.loading} isDisabled={!content.trim()}>
          Submit
        </Button>
      </Flex>
    </Flex>
  );
}
