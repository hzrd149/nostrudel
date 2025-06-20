import { useOutletContext } from "react-router-dom";
import { kinds } from "nostr-tools";

import { useAdditionalRelayContext } from "../../providers/local/additional-relay";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import ArticleCard from "../articles/components/article-card";
import { ErrorBoundary } from "../../components/error-boundary";
import useMaxPageWidth from "../../hooks/use-max-page-width";
import SimpleView from "../../components/layout/presets/simple-view";

export default function UserArticlesTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const { loader, timeline: articles } = useTimelineLoader(pubkey + "-articles", readRelays, {
    authors: [pubkey],
    kinds: [kinds.LongFormArticle],
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  const maxWidth = useMaxPageWidth();

  return (
    <SimpleView maxW={maxWidth} title="Articles" center>
      <IntersectionObserverProvider callback={callback}>
        {articles?.map((article) => (
          <ErrorBoundary key={article.id} event={article}>
            <ArticleCard article={article} />
          </ErrorBoundary>
        ))}
        <TimelineActionAndStatus loader={loader} />
      </IntersectionObserverProvider>
    </SimpleView>
  );
}
