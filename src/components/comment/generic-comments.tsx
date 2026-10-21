import { Flex, FlexProps } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";
import { COMMENT_KIND } from "applesauce-common/helpers";
import { CommentsModel } from "applesauce-common/models";
import { useEventModel } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { isAddressableKind } from "nostr-tools/kinds";

import { useReadRelays } from "../../hooks/use-client-relays";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import CommentPost from "./comment-post";
import { sortByDate } from "../../helpers/nostr/event";
import { ReactNode, useMemo } from "react";

export type GenericCommentsProps = {
  event: NostrEvent;
  /** Only show top-level comments by these pubkeys */
  authors?: string[];
  /** Rendered when there are no comments to show */
  empty?: ReactNode;
} & Omit<FlexProps, "children">;

export function GenericComments({ event, authors, empty, ...flexProps }: GenericCommentsProps) {
  const readRelays = useReadRelays();
  const { loader } = useTimelineLoader(
    `${getEventUID(event)}-comments`,
    readRelays,
    isAddressableKind(event.kind)
      ? {
          kinds: [COMMENT_KIND],
          "#A": [getEventUID(event)],
        }
      : {
          kinds: [COMMENT_KIND],
          "#E": [event.id],
        },
  );

  const comments = useEventModel(CommentsModel, [event]);
  const callback = useTimelineCurserIntersectionCallback(loader);

  const sorted = useMemo(() => {
    if (!comments) return undefined;
    const allowed = authors && new Set(authors);
    const visible = allowed ? comments.filter((c) => allowed.has(c.pubkey)) : [...comments];
    return visible.sort((a, b) => sortByDate(a, b));
  }, [comments, authors]);

  return (
    <IntersectionObserverProvider callback={callback}>
      <Flex direction="column" gap="2" {...flexProps}>
        {sorted?.length === 0 && empty}
        {sorted?.map((comment) => (
          <CommentPost key={comment.id} event={comment} level={0} />
        ))}
      </Flex>
    </IntersectionObserverProvider>
  );
}
