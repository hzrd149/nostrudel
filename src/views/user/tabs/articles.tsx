import { Divider } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";

import { ErrorBoundary } from "../../../components/error-boundary";
import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import LoadMoreButton from "../../../components/timeline/load-more-button";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useUserOutbox } from "../../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import ArticleCard from "../../articles/components/article-card";

export default function UserArticlesTab() {
  const user = useParamsProfilePointer("pubkey");
  const relays = useUserOutbox(user) || [];

  const { loader, timeline: articles } = useTimelineLoader(user.pubkey + "-articles", relays, {
    authors: [user.pubkey],
    kinds: [kinds.LongFormArticle],
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ScrollLayout maxW="6xl" center flush gap={0}>
      <IntersectionObserverProvider callback={callback}>
        {articles?.map((article) => (
          <ErrorBoundary key={getEventUID(article)} event={article}>
            <ArticleCard article={article} />
            <Divider />
          </ErrorBoundary>
        ))}
        <LoadMoreButton loader={loader} />
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
