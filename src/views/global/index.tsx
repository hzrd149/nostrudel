import {
  Flex,
  SkeletonText,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { useSubscription } from "../../hooks/use-subscription";
import { Post } from "../../components/post";
import moment from "moment/moment";
import settings from "../../services/settings";
import useSubject from "../../hooks/use-subject";
import { useEventDir } from "../../hooks/use-event-dir";
import { Subscription } from "../../services/subscriptions";
import { isPost, isReply } from "../../helpers/nostr-event";

const PostsTimeline = ({ sub }: { sub: Subscription }) => {
  const { events } = useEventDir(sub, isPost);

  const timeline = Object.values(events).sort(
    (a, b) => b.created_at - a.created_at
  );

  if (timeline.length === 0) {
    return <SkeletonText />;
  }

  if (timeline.length > 20) timeline.length = 20;

  return (
    <Flex direction="column" gap="2">
      {timeline.map((event) => (
        <Post key={event.id} event={event} />
      ))}
    </Flex>
  );
};

const RepliesTimeline = ({ sub }: { sub: Subscription }) => {
  const { events } = useEventDir(sub, isReply);

  const timeline = Object.values(events).sort(
    (a, b) => b.created_at - a.created_at
  );

  if (timeline.length === 0) {
    return <SkeletonText />;
  }

  if (timeline.length > 20) timeline.length = 20;

  return (
    <Flex direction="column" gap="2">
      {timeline.map((event) => (
        <Post key={event.id} event={event} />
      ))}
    </Flex>
  );
};

export const GlobalView = () => {
  const relays = useSubject(settings.relays);

  const sub = useSubscription(
    relays,
    { kinds: [1], limit: 10, since: moment().startOf("day").valueOf() / 1000 },
    "global-events"
  );

  return (
    <Tabs
      display="flex"
      flexDirection="column"
      flexGrow="1"
      overflow="hidden"
      isLazy
    >
      <TabList>
        <Tab>Notes</Tab>
        <Tab>Replies</Tab>
      </TabList>
      <TabPanels overflow="auto" height="100%">
        <TabPanel pr={0} pl={0}>
          <PostsTimeline sub={sub} />
        </TabPanel>
        <TabPanel pr={0} pl={0}>
          <RepliesTimeline sub={sub} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
