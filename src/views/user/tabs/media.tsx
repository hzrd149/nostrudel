import { PICTURE_POST_KIND } from "applesauce-core/helpers";

import TimelinePage from "../../../components/timeline-page";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import UserLayout from "../components/layout";

export default function UserPicturePostsTab() {
  const user = useParamsProfilePointer("pubkey");
  const mailboxes = useUserMailboxes(user);
  const readRelays = useReadRelays();

  const { loader, timeline } = useTimelineLoader(user.pubkey + "-picture-posts", mailboxes?.outboxes || readRelays, {
    authors: [user.pubkey],
    kinds: [PICTURE_POST_KIND],
  });

  return (
    <UserLayout title="Media" maxW="4xl" center>
      <TimelinePage loader={loader} timeline={timeline} pt="2" pb="12" px="2" />
    </UserLayout>
  );
}
