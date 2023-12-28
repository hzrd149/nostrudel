import { useOutletContext } from "react-router-dom";
import { Kind } from "nostr-tools";

import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import VerticalPageLayout from "../../components/vertical-page-layout";
import ArticleNote from "../../components/timeline-page/generic-note-timeline/article-note";

export default function UserArticlesTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const timeline = useTimelineLoader(pubkey + "-articles", readRelays, {
    authors: [pubkey],
    kinds: [Kind.Article],
  });

  const articles = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        {articles.map((article) => (
          <ArticleNote key={article.id} article={article} />
        ))}
        <TimelineActionAndStatus timeline={timeline} />
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
