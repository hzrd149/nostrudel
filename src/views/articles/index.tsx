import { useCallback, useMemo } from "react";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { Button, Flex, Heading, Spacer } from "@chakra-ui/react";
import { getEventUID } from "nostr-idb";
import { Link as RouterLink } from "react-router-dom";

import VerticalPageLayout from "../../components/vertical-page-layout";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import Plus from "../../components/icons/plus";
import { useReadRelays } from "../../hooks/use-client-relays";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import ArticleCard from "./components/article-card";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import { getArticleTitle } from "../../helpers/nostr/long-form";

function ArticlesHomePage() {
  const relays = useReadRelays();
  const userMuteFilter = useClientSideMuteFilter();

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (userMuteFilter(event)) return false;
      return true;
    },
    [userMuteFilter],
  );

  const { filter, listId } = usePeopleListContext();
  const query = useMemo<Filter[] | undefined>(() => {
    if (!filter) return undefined;
    return [{ authors: filter.authors, kinds: [kinds.LongFormArticle] }];
  }, [filter]);

  const timeline = useTimelineLoader(`${listId ?? "global"}-articles`, relays, query, { eventFilter });

  const articles = useSubject(timeline.timeline).filter((article) => !!getArticleTitle(article));
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <Heading>Articles</Heading>
        <PeopleListSelection />
        <Spacer />
        {/* <Button as={RouterLink} to="/articles/new" colorScheme="primary" leftIcon={<Plus boxSize={6} />}>
          New
        </Button> */}
      </Flex>

      <IntersectionObserverProvider callback={callback}>
        {articles.map((article) => (
          <ArticleCard key={getEventUID(article)} article={article} />
        ))}
        <TimelineActionAndStatus timeline={timeline} />
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

export default function ArticlesHomeView() {
  return (
    <PeopleListProvider>
      <ArticlesHomePage />
    </PeopleListProvider>
  );
}
