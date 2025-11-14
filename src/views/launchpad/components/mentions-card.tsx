import { Box, Button, Card, CardBody, CardHeader, CardProps, Heading, Link } from "@chakra-ui/react";
import { COMMENT_KIND } from "applesauce-core/helpers";
import { TimelineModel } from "applesauce-core/models";
import { useActiveAccount, useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { getContentPointers } from "applesauce-factory/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { useMemo, useState } from "react";
import dayjs from "dayjs";

import { ErrorBoundary } from "../../../components/error-boundary";
import RouterLink from "../../../components/router-link";
import MentionCard from "../../notifications/mentions/components/mention-card";
import { socialNotificationsLoader$ } from "../../../services/notifications";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import TimePeriodSelect, { getTimePeriodLabel, getTimePeriodTimestamp, TimePeriod } from "./time-period-select";

export default function MentionsCard({ ...props }: Omit<CardProps, "children">) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("lastWeek");

  // Get account
  const account = useActiveAccount()!;

  // Get timeline of social events
  const events = useEventModel(TimelineModel, [
    { kinds: [kinds.ShortTextNote, kinds.LongFormArticle, COMMENT_KIND], "#p": [account.pubkey] },
  ]);

  // Start the social notifications loader
  const loader = useObservableEagerState(socialNotificationsLoader$);
  const callback = useTimelineCurserIntersectionCallback(loader ?? undefined);

  // Filter events to only show mentions in the selected time period
  const mentions = useMemo<NostrEvent[]>(() => {
    if (!events || events.length === 0) return [];

    const cutoffTimestamp = getTimePeriodTimestamp(timePeriod);

    return events
      .filter((event) => {
        // Filter by time period
        if (event.created_at < cutoffTimestamp) return false;

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
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 10); // Show only the 10 most recent mentions
  }, [events, account.pubkey, timePeriod]);

  return (
    <IntersectionObserverProvider callback={callback}>
      <Card variant="outline" {...props}>
        <CardHeader display="flex" justifyContent="space-between" alignItems="center" gap="2">
          <Heading size="md">
            <Link as={RouterLink} to="/notifications/mentions">
              Mentions
            </Link>
          </Heading>
          <TimePeriodSelect value={timePeriod} onChange={setTimePeriod} />
        </CardHeader>
        <CardBody p="0" overflowY="auto" maxH="50vh" borderTopWidth={1}>
          {mentions.length > 0 ? (
            <>
              {mentions.map((event) => (
                <ErrorBoundary key={event.id}>
                  <MentionCard event={event} />
                </ErrorBoundary>
              ))}
              <Button
                as={RouterLink}
                to="/notifications/mentions"
                w="full"
                flexShrink={0}
                variant="link"
                size="lg"
                py="4"
              >
                View All Mentions
              </Button>
            </>
          ) : (
            <Box p="4" textAlign="center" color="gray.500">
              No mentions {getTimePeriodLabel(timePeriod).toLowerCase()}
            </Box>
          )}
        </CardBody>
      </Card>
    </IntersectionObserverProvider>
  );
}
