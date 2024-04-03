import { useState } from "react";
import { Button, Flex } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { getEventUID } from "nostr-idb";
import styled from "@emotion/styled";

import { ThreadItem } from "../../../helpers/thread";
import useEventCount from "../../../hooks/use-event-count";
import PostZapsTab from "./tabs/zaps";
import { ThreadPost } from "./thread-post";
import useEventZaps from "../../../hooks/use-event-zaps";
import PostReactionsTab from "./tabs/reactions";
import useEventReactions from "../../../hooks/use-event-reactions";
import PostRepostsTab from "./tabs/reposts";
import PostQuotesTab from "./tabs/quotes";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useSubject from "../../../hooks/use-subject";
import { getContentTagRefs } from "../../../helpers/nostr/event";

const HiddenScrollbar = styled(Flex)`
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none;
  }
`;

export default function DetailsTabs({ post }: { post: ThreadItem }) {
  const [selected, setSelected] = useState("replies");
  const repostCount = useEventCount({ "#e": [post.event.id], kinds: [kinds.Repost, kinds.GenericRepost] });

  const zaps = useEventZaps(getEventUID(post.event));
  const reactions = useEventReactions(getEventUID(post.event)) ?? [];

  const readRelays = useReadRelays();
  const timeline = useTimelineLoader(`${post.event.id}-quotes`, readRelays, {
    kinds: [kinds.ShortTextNote],
    "#e": [post.event.id],
  });
  const events = useSubject(timeline.timeline);
  const quotes = events.filter((e) => {
    return getContentTagRefs(e.content, e.tags).some((t) => t[0] === "e" && t[1] === post.event.id);
  });

  const renderContent = () => {
    switch (selected) {
      case "replies":
        return (
          <Flex direction="column" gap="2" pl={{ base: 2, md: 4 }}>
            {post.replies.map((child) => (
              <ThreadPost key={child.event.id} post={child} focusId={undefined} level={0} />
            ))}
          </Flex>
        );
      case "quotes":
        return <PostQuotesTab post={post} quotes={quotes} />;
      case "reactions":
        return <PostReactionsTab post={post} reactions={reactions} />;
      case "reposts":
        return <PostRepostsTab post={post} />;
      case "zaps":
        return <PostZapsTab post={post} zaps={zaps} />;
    }
    return null;
  };

  return (
    <>
      <HiddenScrollbar gap="4" px="2" overflowX="auto">
        <Button
          size="sm"
          flexShrink={0}
          variant={selected === "replies" ? "solid" : "outline"}
          onClick={() => setSelected("replies")}
        >
          Replies{post.replies.length > 0 ? ` (${post.replies.length})` : ""}
        </Button>
        <Button
          size="sm"
          flexShrink={0}
          variant={selected === "quotes" ? "solid" : "outline"}
          onClick={() => setSelected("quotes")}
        >
          Quotes{quotes.length > 0 ? ` (${quotes.length})` : ""}
        </Button>
        <Button
          size="sm"
          flexShrink={0}
          variant={selected === "reposts" ? "solid" : "outline"}
          onClick={() => setSelected("reposts")}
        >
          Reposts{repostCount && repostCount > 0 ? ` (${repostCount})` : ""}
        </Button>
        <Button
          size="sm"
          flexShrink={0}
          variant={selected === "zaps" ? "solid" : "outline"}
          onClick={() => setSelected("zaps")}
        >
          Zaps{zaps.length > 0 ? ` (${zaps.length})` : ""}
        </Button>
        <Button
          size="sm"
          flexShrink={0}
          variant={selected === "reactions" ? "solid" : "outline"}
          onClick={() => setSelected("reactions")}
        >
          Reactions{reactions.length > 0 ? ` (${reactions.length})` : ""}
        </Button>
      </HiddenScrollbar>

      {renderContent()}
    </>
  );
}
