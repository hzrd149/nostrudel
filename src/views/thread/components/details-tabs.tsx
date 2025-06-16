import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { getEventUID } from "applesauce-core/helpers";
import { ThreadItem } from "applesauce-core/models";
import { kinds } from "nostr-tools";
import { ReactNode } from "react";

import { CORRECTION_EVENT_KIND } from "../../../helpers/nostr/corrections";
import { getContentTagRefs } from "../../../helpers/nostr/event";
import { repliesByDate } from "../../../helpers/thread";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useEventZaps from "../../../hooks/use-event-zaps";
import useRouteSearchValue from "../../../hooks/use-route-search-value";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import CorrectionsTab from "./tabs/corrections";
import PostQuotesTab from "./tabs/quotes";
import PostReactionsTab from "./tabs/reactions";
import PostRepostsTab from "./tabs/reposts";
import ToolsTab from "./tabs/tools";
import UnknownTab from "./tabs/unknown";
import PostZapsTab from "./tabs/zaps";
import ThreadPost from "./thread-post";

const HiddenScrollbarTabList = styled(TabList)`
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none;
  }
`;

export default function DetailsTabs({ post }: { post: ThreadItem }) {
  const selected = useRouteSearchValue("tab", "replies");

  const zaps = useEventZaps(post.event);

  const readRelays = useReadRelays();
  const { timeline: events } = useTimelineLoader(`${post.event.id}-thread-refs`, readRelays, {
    "#e": [post.event.id],
  });

  const reactions = events.filter((e) => e.kind === kinds.Reaction);
  const reposts = events.filter((e) => e.kind === kinds.Repost || e.kind === kinds.GenericRepost);
  const quotes = events.filter((e) => {
    if (e.kind !== kinds.ShortTextNote) return false;

    return (
      e.tags.some((t) => t[0] === "q" && t[1] === post.event.id) ||
      getContentTagRefs(e.content, e.tags).some((t) => t[0] === "e" && t[1] === post.event.id)
    );
  });
  const corrections = events.filter((e) => {
    return e.kind === CORRECTION_EVENT_KIND && e.pubkey === post.event.pubkey;
  });

  const unknown = events.filter(
    (e) =>
      !Array.from(post.replies).some((p) => p.event.id === e.id) &&
      e.kind !== kinds.ShortTextNote &&
      e.kind !== kinds.Zap &&
      !reactions.includes(e) &&
      !reposts.includes(e) &&
      !quotes.includes(e) &&
      !corrections.includes(e),
  );

  const tabs: { id: string; name: string; element: ReactNode; visible: boolean; right?: boolean }[] = [
    {
      id: "replies",
      name: `Replies (${post.replies.size})`,
      visible: true,
      element: (
        <TabPanel key="replies" display="flex" flexDirection="column" gap="2" py="2" pr="0" pl={{ base: 2, md: 4 }}>
          {repliesByDate(post).map((child) => (
            <ThreadPost key={child.event.id} post={child} focusId={undefined} level={0} />
          ))}
        </TabPanel>
      ),
    },
    {
      id: "quotes",
      name: `Quotes (${quotes.length})`,
      visible: quotes.length > 0,
      element: (
        <TabPanel key="quotes" p="0" py="2">
          <PostQuotesTab post={post} quotes={quotes} />
        </TabPanel>
      ),
    },
    {
      id: "zaps",
      name: `Zaps (${zaps.length})`,
      visible: zaps.length > 0,
      element: (
        <TabPanel key="zaps" p="0" py="2">
          <PostZapsTab post={post} zaps={zaps} />
        </TabPanel>
      ),
    },
    {
      id: "reposts",
      name: `Reposts (${reposts.length})`,
      visible: reposts.length > 0,
      element: (
        <TabPanel key="reposts" p="0" py="2">
          <PostRepostsTab post={post} reposts={reposts} />
        </TabPanel>
      ),
    },
    {
      id: "reactions",
      name: `Reactions (${reactions.length})`,
      visible: reactions.length > 0,
      element: (
        <TabPanel key="reactions" p="0">
          <PostReactionsTab post={post} reactions={reactions} />
        </TabPanel>
      ),
    },
    {
      id: "corrections",
      name: `Corrections (${corrections.length})`,
      visible: corrections.length > 0,
      element: (
        <TabPanel key="corrections" p="0">
          <CorrectionsTab post={post} corrections={corrections} />
        </TabPanel>
      ),
    },
    {
      id: "tools",
      name: "Tools",
      visible: true,
      right: true,
      element: (
        <TabPanel key="tools" p="0">
          <ToolsTab event={post.event} />
        </TabPanel>
      ),
    },
    {
      id: "unknown",
      name: `Unknown (${unknown.length})`,
      visible: unknown.length > 0,
      element: (
        <TabPanel key="unknown" p="0" py="2">
          <UnknownTab post={post} events={unknown} />
        </TabPanel>
      ),
    },
  ];

  const s = tabs.find((t) => t.id === selected.value);
  const index = s ? tabs.indexOf(s) : 0;

  return (
    <Tabs
      display="flex"
      flexDirection="column"
      flexGrow="1"
      isLazy
      index={index}
      onChange={(v) => {
        if (tabs[v]) selected.setValue(tabs[v].id, true);
        else selected.clearValue(true);
      }}
      h="full"
      colorScheme="primary"
      variant="solid-rounded"
      size="sm"
    >
      <HiddenScrollbarTabList px="2" gap="2" whiteSpace="pre" overflowX="auto">
        {tabs
          .filter((t) => t.visible)
          .map((tab) => (
            <Tab key={tab.id} ml={tab.right ? "auto" : undefined}>
              {tab.name}
            </Tab>
          ))}
      </HiddenScrollbarTabList>
      <TabPanels minH={{ base: "50vh", md: "0" }}>{tabs.filter((t) => t.visible).map((tab) => tab.element)}</TabPanels>
    </Tabs>
  );
}
