import { Divider } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";

import { ErrorBoundary } from "../../../components/error-boundary";
import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import LoadMoreButton from "../../../components/timeline/load-more-button";
import TimelinePoll from "../../../components/timeline/poll";
import { POLL_KIND } from "../../../helpers/nostr/polls";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useUserOutbox } from "../../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";

export default function UserPollsTab() {
  const user = useParamsProfilePointer("pubkey");
  const relays = useUserOutbox(user) || [];

  const { loader, timeline: polls } = useTimelineLoader(user.pubkey + "-polls", relays, {
    authors: [user.pubkey],
    kinds: [POLL_KIND],
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ScrollLayout maxW="6xl" center flush gap={0}>
      <IntersectionObserverProvider callback={callback}>
        {polls?.map((poll) => (
          <ErrorBoundary key={getEventUID(poll)} event={poll}>
            <TimelinePoll event={poll} showReplyButton />
            <Divider />
          </ErrorBoundary>
        ))}
        <LoadMoreButton loader={loader} />
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
