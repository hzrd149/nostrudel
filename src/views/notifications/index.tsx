import { Badge, Button, ButtonGroup, Flex, SimpleGrid, Text } from "@chakra-ui/react";
import { useMemo } from "react";

import { useLocalStorage } from "react-use";
import { AtIcon, LightningIcon, QuoteIcon, ReplyIcon, RepostIcon, ThreadIcon } from "../../components/icons";
import SimpleNavBox from "../../components/layout/box-layout/simple-nav-box";
import SimpleView from "../../components/layout/presets/simple-view";
import useNotificationSync from "../../hooks/use-notification-sync";
import { getNotificationSyncSummary } from "../../helpers/notification-sync";
import { useNotificationCounts } from "./components/notification-counts";
import TimeRangeSelect, { getTimeRangeLabel, getTimeRangeSince, TimeRange } from "./components/time-range-select";

// Metadata shared by every SimpleNavBox below; null at zero count, otherwise a badge plus the
// selected time range's label (omitted for the all-time range).
function NotificationCountBadge({
  count,
  timeRange,
  timeRangeLabel,
}: {
  count: number;
  timeRange: TimeRange;
  timeRangeLabel: string;
}) {
  if (count === 0) return null;

  return (
    <Flex alignItems="center" gap="2">
      <Badge colorScheme="primary" fontSize="sm">
        {count}
      </Badge>
      {timeRange !== "all" && (
        <Text fontSize="xs" color="GrayText">
          {timeRangeLabel}
        </Text>
      )}
    </Flex>
  );
}

export default function NotificationsView() {
  const [timeRange = "2days", setTimeRange] = useLocalStorage<TimeRange>("notifications-time-range");
  const counts = useNotificationCounts(timeRange);

  const timeRangeLabel = useMemo(() => getTimeRangeLabel(timeRange).toLowerCase(), [timeRange]);

  const since = useMemo(() => getTimeRangeSince(timeRange), [timeRange]);
  const social = useNotificationSync("conversations", since);
  const reposts = useNotificationSync("reposts", since);
  const zaps = useNotificationSync("zaps", since);
  const states = [social, reposts, zaps];
  const loading = states.some((state) => getNotificationSyncSummary(state).loading);
  const incomplete = states.some((state) => {
    const summary = getNotificationSyncSummary(state);
    return summary.incomplete || summary.noRelays;
  });

  return (
    <SimpleView
      title="Notifications"
      flush
      actions={
        <ButtonGroup ms="auto">
          <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
        </ButtonGroup>
      }
    >
      {loading && (
        <Text as="output" aria-live="polite" px="4">
          Syncing notifications…
        </Text>
      )}
      {incomplete && (
        <Flex alignItems="center" gap="2" px="4">
          <Text as="output" aria-live="polite">
            Some notification sources are unavailable. Counts may be incomplete.
          </Text>
          <Button onClick={() => states.forEach((state) => state?.retry())} isDisabled={loading}>
            Retry
          </Button>
        </Flex>
      )}
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }}>
        <SimpleNavBox
          icon={<ReplyIcon boxSize={12} />}
          title="Replies"
          description="Direct replies to your notes"
          to="/notifications/replies"
          metadata={
            <NotificationCountBadge count={counts.replies} timeRange={timeRange} timeRangeLabel={timeRangeLabel} />
          }
        />
        <SimpleNavBox
          icon={<AtIcon boxSize={12} />}
          title="Mentions"
          description="See where you've been mentioned"
          to="/notifications/mentions"
          metadata={
            <NotificationCountBadge count={counts.mentions} timeRange={timeRange} timeRangeLabel={timeRangeLabel} />
          }
        />
        <SimpleNavBox
          icon={<ThreadIcon boxSize={12} />}
          title="Threads"
          description="Conversations in your threads"
          to="/notifications/threads"
          metadata={
            <NotificationCountBadge count={counts.threads} timeRange={timeRange} timeRangeLabel={timeRangeLabel} />
          }
        />
        <SimpleNavBox
          icon={<QuoteIcon boxSize={12} />}
          title="Quotes"
          description="Who has quoted your notes"
          to="/notifications/quotes"
          metadata={
            <NotificationCountBadge count={counts.quotes} timeRange={timeRange} timeRangeLabel={timeRangeLabel} />
          }
        />
        <SimpleNavBox
          icon={<RepostIcon boxSize={12} />}
          title="Reposts"
          description="Who has reposted your notes"
          to="/notifications/reposts"
          metadata={
            <NotificationCountBadge count={counts.reposts} timeRange={timeRange} timeRangeLabel={timeRangeLabel} />
          }
        />
        <SimpleNavBox
          icon={<LightningIcon boxSize={12} />}
          title="Zaps"
          description="Lightning payments you've received"
          to="/notifications/zaps"
          metadata={
            <NotificationCountBadge count={counts.zaps} timeRange={timeRange} timeRangeLabel={timeRangeLabel} />
          }
        />
      </SimpleGrid>
    </SimpleView>
  );
}
