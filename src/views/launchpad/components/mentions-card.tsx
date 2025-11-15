import { Box, Button, Card, CardBody, CardHeader, CardProps, Heading, Link } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useMemo, useState } from "react";

import { ErrorBoundary } from "../../../components/error-boundary";
import RouterLink from "../../../components/router-link";
import MentionCard from "../../notifications/mentions/components/mention-card";
import { mentionNotifications$ } from "../../../services/notifications";
import TimePeriodSelect, { getTimePeriodLabel, getTimePeriodTimestamp, TimePeriod } from "./time-period-select";

export default function MentionsCard({ ...props }: Omit<CardProps, "children">) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("lastWeek");

  // Get mention notifications from the observable
  const allMentions = useObservableEagerState(mentionNotifications$) ?? [];

  // Filter mentions by the selected time period and limit to 10
  const mentions = useMemo<NostrEvent[]>(() => {
    const cutoffTimestamp = getTimePeriodTimestamp(timePeriod);

    return allMentions.filter((event) => event.created_at >= cutoffTimestamp).slice(0, 10); // Show only the 10 most recent mentions
  }, [allMentions, timePeriod]);

  return (
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
  );
}
