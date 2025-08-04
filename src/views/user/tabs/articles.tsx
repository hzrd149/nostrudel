import { kinds } from "nostr-tools";

import { ErrorBoundary } from "../../../components/error-boundary";
import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import TimelineActionAndStatus from "../../../components/timeline/timeline-action-and-status";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import { useAdditionalRelayContext } from "../../../providers/local/additional-relay";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import ArticleCard from "../../articles/components/article-card";

export default function UserArticlesTab() {
  const user = useParamsProfilePointer("pubkey");
  const mailboxes = useUserMailboxes(user);
  const readRelays = useAdditionalRelayContext();

  const { loader, timeline: articles } = useTimelineLoader(
    user.pubkey + "-articles",
    mailboxes?.outboxes || readRelays,
    {
      authors: [user.pubkey],
      kinds: [kinds.LongFormArticle],
    },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ScrollLayout maxW="6xl" center>
      <IntersectionObserverProvider callback={callback}>
        {articles?.map((article) => (
          <ErrorBoundary key={article.id} event={article}>
            <ArticleCard article={article} />
          </ErrorBoundary>
        ))}
        <TimelineActionAndStatus loader={loader} />
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
