import { Button, Flex, Spinner } from "@chakra-ui/react";
import moment from "moment";
import { Post } from "../../components/post";
import { isPost } from "../../helpers/nostr-event";
import useSubject from "../../hooks/use-subject";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { useUserContacts } from "../../hooks/use-user-contacts";
import identity from "../../services/identity";

export const FollowingPostsTab = () => {
  const pubkey = useSubject(identity.pubkey);
  const contacts = useUserContacts(pubkey);

  const following = contacts?.contacts || [];
  const { events, loading, loadMore } = useTimelineLoader(
    `following-posts`,
    { authors: following, kinds: [1], since: moment().subtract(2, "hour").unix() },
    { pageSize: moment.duration(2, "hour").asSeconds(), enabled: following.length > 0 }
  );

  const timeline = events.filter(isPost);

  return (
    <Flex direction="column" overflow="auto" gap="2">
      {timeline.map((event) => (
        <Post key={event.id} event={event} />
      ))}
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
};
