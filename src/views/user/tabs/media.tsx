import { PICTURE_POST_KIND } from "applesauce-core/helpers";

import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import TimelinePage from "../../../components/timeline-page";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useUserOutbox } from "../../../hooks/use-user-mailboxes";

export default function UserPicturePostsTab() {
  const user = useParamsProfilePointer("pubkey");
  const relays = useUserOutbox(user) || [];

  const { loader, timeline } = useTimelineLoader(user.pubkey + "-picture-posts", relays, {
    authors: [user.pubkey],
    kinds: [PICTURE_POST_KIND],
  });

  return (
    <ScrollLayout maxW="4xl" center>
      <TimelinePage loader={loader} timeline={timeline} pt="2" pb="12" px="2" />
    </ScrollLayout>
  );
}
