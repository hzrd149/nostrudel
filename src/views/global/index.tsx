import { Flex, SkeletonText, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { useSubscription } from "../../hooks/use-subscription";
import { Post } from "../../components/post";
import moment from "moment/moment";
import { useEventDir } from "../../hooks/use-event-dir";
import { isPost, isReply } from "../../helpers/nostr-event";
import { NostrEvent } from "../../types/nostr-event";

const PostsTimeline = ({ timeline }: { timeline: NostrEvent[] }) => {
  if (timeline.length === 0) {
    return <SkeletonText />;
  }

  return (
    <Flex direction="column" gap="2">
      {timeline.filter(isPost).map((event) => (
        <Post key={event.id} event={event} />
      ))}
    </Flex>
  );
};

const RepliesTimeline = ({ timeline }: { timeline: NostrEvent[] }) => {
  if (timeline.length === 0) {
    return <SkeletonText />;
  }

  return (
    <Flex direction="column" gap="2">
      {timeline.filter(isReply).map((event) => (
        <Post key={event.id} event={event} />
      ))}
    </Flex>
  );
};

export const GlobalView = () => {
  const sub = useSubscription(
    { kinds: [1], limit: 10, since: moment().startOf("day").valueOf() / 1000 },
    { name: "global-events" }
  );

  const { events } = useEventDir(sub);
  const timeline = Object.values(events).sort((a, b) => b.created_at - a.created_at);

  return (
    <Tabs display="flex" flexDirection="column" flexGrow="1" overflow="hidden" isLazy>
      <TabList>
        <Tab>Posts</Tab>
        <Tab>Replies</Tab>
      </TabList>
      <TabPanels overflow="auto" height="100%">
        <TabPanel pr={0} pl={0}>
          <PostsTimeline timeline={timeline} />
        </TabPanel>
        <TabPanel pr={0} pl={0}>
          <RepliesTimeline timeline={timeline} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
