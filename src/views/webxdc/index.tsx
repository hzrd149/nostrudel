import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  Image,
  LinkBox,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { memo, useCallback, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { NostrEvent } from "nostr-tools";

import { ErrorBoundary } from "../../components/error-boundary";
import HoverLinkOverlay from "../../components/hover-link-overlay";
import VerticalPageLayout from "../../components/vertical-page-layout";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import Timestamp from "../../components/timestamp";
import { UserAvatarLink } from "../../components/user/user-avatar-link";
import UserLink from "../../components/user/user-link";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { useReadRelays } from "../../hooks/use-client-relays";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useShareableEventAddress from "../../hooks/use-shareable-event-address";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import {
  WEBXDC_KIND,
  WEBXDC_MIME_TYPE,
  getWebxdcImage,
  getWebxdcName,
  getWebxdcSummary,
  validateWebxdc,
} from "../../helpers/nostr/webxdc";

const WebxdcCard = memo(({ app }: { app: NostrEvent }) => {
  const ref = useEventIntersectionRef<HTMLDivElement>(app);
  const address = useShareableEventAddress(app);
  const name = getWebxdcName(app);
  const summary = getWebxdcSummary(app);
  const image = getWebxdcImage(app);

  return (
    <Card as={LinkBox} ref={ref}>
      <CardHeader p="4" pb="2">
        <Flex gap="3" alignItems="center">
          {image && (
            <Image src={image} alt={name} boxSize="48px" objectFit="contain" borderRadius="md" flexShrink={0} />
          )}
          <Flex direction="column" flex="1" minW="0">
            <Heading size="md" noOfLines={1}>
              <HoverLinkOverlay as={RouterLink} to={`/webxdc/${address}`}>
                {name}
              </HoverLinkOverlay>
            </Heading>
            <Flex gap="2" alignItems="center">
              <UserAvatarLink size="xs" pubkey={app.pubkey} />
              <UserLink pubkey={app.pubkey} />
            </Flex>
          </Flex>
        </Flex>
      </CardHeader>
      {summary && (
        <CardBody px="4" py="2">
          <Text noOfLines={2} color="gray.600" fontSize="sm">
            {summary}
          </Text>
        </CardBody>
      )}
      <CardFooter px="4" py="2">
        <Flex justifyContent="space-between" w="full" alignItems="center">
          <Text fontSize="xs" color="gray.500">
            Webxdc App
          </Text>
          <Timestamp timestamp={app.created_at} />
        </Flex>
      </CardFooter>
    </Card>
  );
});

function WebxdcPage() {
  const { filter, listId } = usePeopleListContext();
  const relays = useReadRelays();

  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (e: NostrEvent) => {
      if (muteFilter(e)) return false;
      if (!validateWebxdc(e)) return false;
      return true;
    },
    [muteFilter],
  );

  const query = useMemo(() => {
    if (!filter) return undefined;
    return { ...filter, kinds: [WEBXDC_KIND], "#m": [WEBXDC_MIME_TYPE] };
  }, [filter]);

  const { loader, timeline: apps } = useTimelineLoader(`${listId || "global"}-webxdc`, relays, query, {
    eventFilter,
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center">
        <Heading size="lg">Webxdc Apps</Heading>
        <Spacer />
        <PeopleListSelection />
        <Button as={RouterLink} to="/webxdc/new" colorScheme="primary">
          Share App
        </Button>
      </Flex>
      <IntersectionObserverProvider callback={callback}>
        <Flex direction="column" gap="3">
          {apps?.map((app) => (
            <ErrorBoundary key={app.id}>
              <WebxdcCard app={app} />
            </ErrorBoundary>
          ))}
        </Flex>
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

export default function WebxdcView() {
  return (
    <PeopleListProvider>
      <WebxdcPage />
    </PeopleListProvider>
  );
}
