import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardProps,
  Flex,
  Heading,
  LinkBox,
  LinkOverlay,
  SimpleGrid,
} from "@chakra-ui/react";
import { useNavigate, Link as RouterLink } from "react-router-dom";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { DMV_CONTENT_DISCOVERY_JOB_KIND } from "../../../helpers/nostr/dvm";
import useSubject from "../../../hooks/use-subject";
import { ChevronLeftIcon } from "@chakra-ui/icons";
import { NostrEvent } from "../../../types/nostr-event";

function DVMCard({ appData, ...props }: Omit<CardProps, "children"> & { appData: NostrEvent }) {
  const metadata = JSON.parse(appData.content);

  return (
    <Card as={LinkBox} {...props}>
      <Box
        aspectRatio={2 / 1}
        backgroundImage={metadata.image || metadata.picture}
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
        backgroundSize="cover"
      />
      <CardHeader p="4">
        <Heading size="md">
          <LinkOverlay as={RouterLink} to={`/tools/content-discovery/${appData.pubkey}`}>
            {metadata.name || metadata.display_name}
          </LinkOverlay>
        </Heading>
      </CardHeader>
      <CardBody px="4" pb="4" pt="0">
        {metadata.about}
      </CardBody>
    </Card>
  );
}

export default function ContentDiscoveryView() {
  const navigate = useNavigate();

  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader("content-discovery-dvms", readRelays, {
    kinds: [31990],
    "#k": [String(DMV_CONTENT_DISCOVERY_JOB_KIND)],
  });

  const DMVs = useSubject(timeline.timeline);

  return (
    <VerticalPageLayout>
      <Flex>
        <Button leftIcon={<ChevronLeftIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Flex>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }}>
        {DMVs.map((appData) => (
          <DVMCard key={appData.id} appData={appData} maxW="lg" />
        ))}
      </SimpleGrid>
    </VerticalPageLayout>
  );
}
