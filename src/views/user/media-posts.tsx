import { useOutletContext } from "react-router-dom";
import { PICTURE_POST_KIND } from "applesauce-core/helpers";

import { useAdditionalRelayContext } from "../../providers/local/additional-relay";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import TimelinePage from "../../components/timeline-page";

export default function UserPicturePostsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const { loader, timeline } = useTimelineLoader(pubkey + "-picture-posts", readRelays, {
    authors: [pubkey],
    kinds: [PICTURE_POST_KIND],
  });

  return <TimelinePage loader={loader} timeline={timeline} pt="2" pb="12" px="2" />;
}
