import { useOutletContext } from "react-router-dom";

import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import TimelinePage from "../../components/timeline-page";
import { MEDIA_POST_KIND } from "../../helpers/nostr/media";

export default function UserMediaPostsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const { loader, timeline } = useTimelineLoader(pubkey + "-media-posts", readRelays, {
    authors: [pubkey],
    kinds: [MEDIA_POST_KIND],
  });

  return <TimelinePage loader={loader} timeline={timeline} pt="2" pb="12" px="2" />;
}
