import { Button, Flex } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { getEventUID } from "nostr-idb";
import styled from "@emotion/styled";
import { ThreadItem } from "applesauce-core/queries";

import PostZapsTab from "./tabs/zaps";
import ThreadPost from "./thread-post";
import useEventZaps from "../../../hooks/use-event-zaps";
import PostReactionsTab from "./tabs/reactions";
import PostRepostsTab from "./tabs/reposts";
import PostQuotesTab from "./tabs/quotes";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useSubject from "../../../hooks/use-subject";
import { getContentTagRefs } from "../../../helpers/nostr/event";
import { CORRECTION_EVENT_KIND } from "../../../helpers/nostr/corrections";
import CorrectionsTab from "./tabs/corrections";
import useRouteStateValue from "../../../hooks/use-route-state-value";
import UnknownTab from "./tabs/unknown";
import { repliesByDate } from "../../../helpers/thread";

const HiddenScrollbar = styled(Flex)`
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none;
  }
`;

export default function DetailsTabs({ post }: { post: ThreadItem }) {
  const { value: selected, setValue: setSelected } = useRouteStateValue("tab", "replies");

  const zaps = useEventZaps(getEventUID(post.event));

  const readRelays = useReadRelays();
  const timeline = useTimelineLoader(`${post.event.id}-thread-refs`, readRelays, { "#e": [post.event.id] });
  const events = useSubject(timeline.timeline);

  const reactions = events.filter((e) => e.kind === kinds.Reaction);
  const reposts = events.filter((e) => e.kind === kinds.Repost || e.kind === kinds.GenericRepost);
  const quotes = events.filter((e) => {
    return (
      e.kind === kinds.ShortTextNote &&
      getContentTagRefs(e.content, e.tags).some((t) => t[0] === "e" && t[1] === post.event.id)
    );
  });
  const corrections = events.filter((e) => {
    return e.kind === CORRECTION_EVENT_KIND;
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

  const renderContent = () => {
    switch (selected) {
      case "replies":
        return (
          <Flex direction="column" gap="2" pl={{ base: 2, md: 4 }}>
            {repliesByDate(post).map((child) => (
              <ThreadPost key={child.event.id} post={child} focusId={undefined} level={0} />
            ))}
          </Flex>
        );
      case "quotes":
        return <PostQuotesTab post={post} quotes={quotes} />;
      case "reactions":
        return <PostReactionsTab post={post} reactions={reactions} />;
      case "reposts":
        return <PostRepostsTab post={post} reposts={reposts} />;
      case "zaps":
        return <PostZapsTab post={post} zaps={zaps} />;
      case "corrections":
        return <CorrectionsTab post={post} corrections={corrections} />;
      case "unknown":
        return <UnknownTab post={post} events={unknown} />;
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
          Replies{post.replies.size > 0 ? ` (${post.replies.size})` : ""}
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
          variant={selected === "zaps" ? "solid" : "outline"}
          onClick={() => setSelected("zaps")}
        >
          Zaps{zaps.length > 0 ? ` (${zaps.length})` : ""}
        </Button>
        <Button
          size="sm"
          flexShrink={0}
          variant={selected === "reposts" ? "solid" : "outline"}
          onClick={() => setSelected("reposts")}
        >
          Reposts{reposts.length && reposts.length > 0 ? ` (${reposts.length})` : ""}
        </Button>
        <Button
          size="sm"
          flexShrink={0}
          variant={selected === "reactions" ? "solid" : "outline"}
          onClick={() => setSelected("reactions")}
          mr="auto"
        >
          Reactions{reactions.length > 0 ? ` (${reactions.length})` : ""}
        </Button>
        {corrections.length > 0 && (
          <Button
            size="sm"
            flexShrink={0}
            variant={selected === "corrections" ? "solid" : "outline"}
            onClick={() => setSelected("corrections")}
          >
            Corrections ({corrections.length})
          </Button>
        )}
        {unknown.length > 0 && (
          <Button
            size="sm"
            flexShrink={0}
            variant={selected === "unknown" ? "solid" : "outline"}
            onClick={() => setSelected("unknown")}
          >
            Unknown Refs ({unknown.length})
          </Button>
        )}
      </HiddenScrollbar>

      {renderContent()}
    </>
  );
}
