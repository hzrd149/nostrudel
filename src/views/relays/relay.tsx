import { useParams } from "react-router-dom";
import {
  Button,
  Flex,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";

import { safeRelayUrl } from "../../helpers/url";
import { useRelayInfo } from "../../hooks/use-relay-info";
import { RelayDebugButton, RelayJoinAction, RelayMetadata } from "./components/relay-card";
import useSubject from "../../hooks/use-subject";
import { useReadRelayUrls, useWriteRelayUrls } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import RelayReviewNote from "./components/relay-review-note";
import SupportedNIPs from "./components/supported-nips";
import { useForm } from "react-hook-form";
import StarRating from "../../components/star-rating";
import { DraftNostrEvent } from "../../types/nostr-event";
import { RELAY_REVIEW_LABEL, RELAY_REVIEW_LABEL_NAMESPACE, REVIEW_KIND } from "../../helpers/nostr/reviews";
import dayjs from "dayjs";
import { useSigningContext } from "../../providers/signing-provider";
import { nostrPostAction } from "../../classes/nostr-post-action";

function RelayReviews({ relay }: { relay: string }) {
  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader(`${relay}-reviews`, readRelays, {
    kinds: [1985],
    "#r": [relay],
    "#l": [RELAY_REVIEW_LABEL],
  });

  const events = useSubject(timeline.timeline);

  return (
    <Flex direction="column" gap="2">
      {events.map((event) => (
        <RelayReviewNote key={event.id} event={event} hideUrl />
      ))}
    </Flex>
  );
}

function RelayReviewForm({ onClose, relay }: { onClose: () => void; relay: string }) {
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
    if (!signed) return;
    nostrPostAction(writeRelays, signed);
    onClose();
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

function RelayPage({ relay }: { relay: string }) {
  const { info } = useRelayInfo(relay);
  const showReviewForm = useDisclosure();

  return (
    <Flex direction="column" alignItems="stretch" gap="2" p="2">
      <Flex gap="2" alignItems="center">
        <Heading isTruncated size={{ base: "md", sm: "lg" }}>
          {relay}
        </Heading>
        <RelayDebugButton url={relay} ml="auto" />
        <RelayJoinAction url={relay} />
      </Flex>
      <RelayMetadata url={relay} />
      {info?.supported_nips && <SupportedNIPs nips={info?.supported_nips} />}
      <Tabs display="flex" flexDirection="column" flexGrow="1" isLazy colorScheme="brand">
        <TabList overflowX="auto" overflowY="hidden" flexShrink={0}>
          <Tab>Reviews</Tab>
          <Tab isDisabled>Notes</Tab>
        </TabList>

        <TabPanels>
          <TabPanel py="2" px="0">
            {showReviewForm.isOpen ? (
              <RelayReviewForm onClose={showReviewForm.onClose} relay={relay} />
            ) : (
              <Button colorScheme="brand" ml="aut" mb="2" onClick={showReviewForm.onOpen}>
                Write review
              </Button>
            )}
            <RelayReviews relay={relay} />
          </TabPanel>
          <TabPanel py="2" px="0"></TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
}

export default function RelayView() {
  const { relay } = useParams<string>();
  if (!relay) return <>No relay url</>;

  const safeUrl = safeRelayUrl(relay);

  if (!safeUrl) return <>Bad relay url</>;

  return <RelayPage relay={safeUrl} />;
}
