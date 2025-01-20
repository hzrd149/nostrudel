import { useCallback, useMemo } from "react";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { Flex, Heading, Spacer } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";

import VerticalPageLayout from "../../components/vertical-page-layout";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import { useReadRelays } from "../../hooks/use-client-relays";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import ArticleCard from "./components/article-card";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import { getArticleTitle } from "../../helpers/nostr/long-form";
import { ErrorBoundary } from "../../components/error-boundary";

function ArticlesHomePage() {
  const relays = useReadRelays();
  const userMuteFilter = useClientSideMuteFilter();

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (userMuteFilter(event)) return false;
      if (!getArticleTitle(event)) return false;
      if (!event.content) return false;
      return true;
    },
    [userMuteFilter],
  );

  const { filter, listId } = usePeopleListContext();
  const filters = useMemo<Filter[] | undefined>(() => {
    if (!filter) return undefined;
    return [{ authors: filter.authors, kinds: [kinds.LongFormArticle] }];
  }, [filter]);

  const { loader, timeline: articles } = useTimelineLoader(`${listId ?? "global"}-articles`, relays, filters, {
    eventFilter,
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <VerticalPageLayout maxW="6xl" mx="auto">
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
          <ErrorBoundary key={getEventUID(article)}>
            <ArticleCard article={article} />
          </ErrorBoundary>
        ))}
        <TimelineActionAndStatus timeline={loader} />
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
