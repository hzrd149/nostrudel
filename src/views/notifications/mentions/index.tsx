import { Box, Flex } from "@chakra-ui/react";
import { COMMENT_KIND } from "applesauce-core/helpers";
import { TimelineModel } from "applesauce-core/models";
import { useActiveAccount, useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { getContentPointers } from "applesauce-factory/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleView from "../../../components/layout/presets/simple-view";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { useVirtualListScrollRestore } from "../../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { socialNotificationsLoader$ } from "../../../services/notifications";
import MentionCard from "./components/mention-card";

function MentionRow({ index, style, data }: ListChildComponentProps<NostrEvent[]>) {
  const event = data[index];
  const ref = useEventIntersectionRef(event);

  return (
    <Box style={style} borderBottomWidth={1} ref={ref}>
      <ErrorBoundary>
        <MentionCard event={event} />
      </ErrorBoundary>
    </Box>
  );
}

export default function MentionsTab() {
  const loader = useObservableEagerState(socialNotificationsLoader$);
  const callback = useTimelineCurserIntersectionCallback(loader ?? undefined);
  const scroll = useVirtualListScrollRestore("manual");

  // Get account
  const account = useActiveAccount()!;

  // Get timeline of social events
  const events = useEventModel(TimelineModel, [
    { kinds: [kinds.ShortTextNote, kinds.LongFormArticle, COMMENT_KIND], "#p": [account.pubkey] },
  ]);

  // Filter events to only show mentions
  const mentions = useMemo<NostrEvent[]>(() => {
    if (!events || events.length === 0) return [];

    return events
      .filter((event) => {
        // Check if the user's pubkey is mentioned in the content
        const pointers = getContentPointers(event.content);
        return pointers.some(
          (p) =>
            // npub mention
            (p.type === "npub" && p.data === account.pubkey) ||
            // nprofile mention
            (p.type === "nprofile" && p.data.pubkey === account.pubkey),
        );
      })
      .sort((a, b) => b.created_at - a.created_at);
  }, [events, account.pubkey]);

  return (
    <IntersectionObserverProvider callback={callback}>
      <SimpleView title="Mentions" scroll={false} flush gap={0}>
        <Flex direction="column" flex={1}>
          {mentions.length > 0 ? (
            <AutoSizer>
              {({ height, width }) => (
                <List
                  itemKey={(index, data) => data[index].id}
                  itemCount={mentions.length}
                  itemSize={80}
                  itemData={mentions}
                  width={width}
                  height={height}
                  {...scroll}
                >
                  {MentionRow}
                </List>
              )}
            </AutoSizer>
          ) : (
            <Box mt="4" textAlign="center">
              No mentions yet
            </Box>
          )}
        </Flex>
      </SimpleView>
    </IntersectionObserverProvider>
  );
}
