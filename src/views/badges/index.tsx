import { useCallback } from "react";
import { Button, Flex, Heading, Image, Link, Spacer } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { kinds } from "nostr-tools";

import { ExternalLinkIcon } from "../../components/icons";
import VerticalPageLayout from "../../components/vertical-page-layout";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useSubject from "../../hooks/use-subject";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import BadgeAwardCard from "./components/badge-award-card";
import { ErrorBoundary } from "../../components/error-boundary";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { NostrEvent } from "../../types/nostr-event";

function BadgesPage() {
  const { filter, listId } = usePeopleListContext();
  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (e: NostrEvent) => {
      if (muteFilter(e)) return false;
      return true;
    },
    [muteFilter],
  );
  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader(
    `${listId}-lists`,
    readRelays,
    {
      "#p": filter?.authors,
      kinds: [kinds.BadgeAward],
    },
    { eventFilter },
  );

  const awards = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout>
      <Flex gap="2" wrap="wrap">
        <Button as={RouterLink} to="/badges/browse">
          Browse Badges
        </Button>
        <Spacer />
        <Button
          as={Link}
          href="https://badges.page/"
          isExternal
          rightIcon={<ExternalLinkIcon />}
          leftIcon={<Image src="https://badges.page/favicon.ico" w="1.2em" />}
        >
          Badges
        </Button>
      </Flex>
      <Flex gap="2" alignItems="center">
        <Heading size="lg">Recent awards</Heading>
        <PeopleListSelection />
      </Flex>
      <IntersectionObserverProvider callback={callback}>
        {awards.map((award) => (
          <ErrorBoundary key={award.id}>
            <BadgeAwardCard award={award} />
          </ErrorBoundary>
        ))}
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

export default function BadgesView() {
  // const account = useCurrentAccount();
  // return account ? <BadgesPage /> : <Navigate to="/lists/browse" />;
  return (
    <PeopleListProvider>
      <BadgesPage />
    </PeopleListProvider>
  );
}
