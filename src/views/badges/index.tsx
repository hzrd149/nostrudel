import { Button, Flex, Heading, Image, Link, Spacer } from "@chakra-ui/react";
import { kinds, NostrEvent } from "nostr-tools";
import { useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";

import { ErrorBoundary } from "../../components/error-boundary";
import { ExternalLinkIcon } from "../../components/icons";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { useReadRelays } from "../../hooks/use-client-relays";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import BadgeAwardCard from "./components/badge-award-card";

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
  const readRelays = useReadRelays();
  const { loader, timeline: awards } = useTimelineLoader(
    `${listId}-lists`,
    readRelays,
    {
      "#p": filter?.authors,
      kinds: [kinds.BadgeAward],
    },
    { eventFilter },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

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
        {awards?.map((award) => (
          <ErrorBoundary key={award.id}>
            <BadgeAwardCard award={award} />
          </ErrorBoundary>
        ))}
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

export default function BadgesHomeView() {
  return (
    <PeopleListProvider>
      <BadgesPage />
    </PeopleListProvider>
  );
}
