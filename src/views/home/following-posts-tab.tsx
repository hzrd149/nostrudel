import { Flex } from "@chakra-ui/react";
import moment from "moment";
import { Post } from "../../components/post";
import { isPost } from "../../helpers/nostr-event";
import { useEventTimelineLoader } from "../../hooks/use-event-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { useUserContacts } from "../../hooks/use-user-contacts";
import identity from "../../services/identity";

export const FollowingPostsTab = () => {
  const pubkey = useSubject(identity.pubkey);
  const contacts = useUserContacts(pubkey);

  const following = contacts?.contacts || [];

  const { timeline } = useEventTimelineLoader(
    {
      authors: following,
      kinds: [1],
    },
    {
      name: "following-posts",
      enabled: following.length > 0,
      filter: isPost,
      initialSince: moment().subtract(1, "hour").unix(),
      pageSize: moment.duration(1, "hour").asSeconds(),
    }
  );

  return (
    <Flex direction="column" overflow="auto" gap="2">
      {timeline.map((event) => (
        <Post key={event.id} event={event} />
      ))}
    </Flex>
  );
};
