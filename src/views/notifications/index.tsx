import { Badge, ButtonGroup, Flex, SimpleGrid, Text } from "@chakra-ui/react";
import { useEffect, useMemo } from "react";

import { useObservableEagerState } from "applesauce-react/hooks";
import { useLocalStorage } from "react-use";
import { AtIcon, LightningIcon, QuoteIcon, ReplyIcon, RepostIcon, ThreadIcon } from "../../components/icons";
import SimpleNavBox from "../../components/layout/box-layout/simple-nav-box";
import SimpleView from "../../components/layout/presets/simple-view";
import {
  shareNotificationsLoader$,
  socialNotificationsLoader$,
  zapNotificationsLoader$,
} from "../../services/notifications";
import { useNotificationCounts } from "./components/notification-counts";
import TimeRangeSelect, { getTimeRangeLabel, getTimeRangeSince, TimeRange } from "./components/time-range-select";

export default function NotificationsView() {
  const [timeRange = "2days", setTimeRange] = useLocalStorage<TimeRange>("notifications-time-range");
  const counts = useNotificationCounts(timeRange);

  const timeRangeLabel = useMemo(() => getTimeRangeLabel(timeRange).toLowerCase(), [timeRange]);

  // Start the event loader
  const socialLoader = useObservableEagerState(socialNotificationsLoader$);
  const zapLoader = useObservableEagerState(zapNotificationsLoader$);
  const shareLoader = useObservableEagerState(shareNotificationsLoader$);

  // Load the initial block for all loaders
  useEffect(() => {
    const ts = getTimeRangeSince(timeRange);
    socialLoader?.(ts).subscribe();
    zapLoader?.(ts).subscribe();
    shareLoader?.(ts).subscribe();
  }, [socialLoader, zapLoader, shareLoader]);

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
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }}>
        <SimpleNavBox
          icon={<ReplyIcon boxSize={12} />}
          title="Replies"
          description="Direct replies to your notes"
          to="/notifications/replies"
          metadata={
            counts.replies === 0 ? null : (
              <Flex alignItems="center" gap="2">
                <Badge colorScheme={counts.replies > 0 ? "primary" : "gray"} fontSize="sm">
                  {counts.replies}
                </Badge>
                {timeRange !== "all" && (
                  <Text fontSize="xs" color="GrayText">
                    {timeRangeLabel}
                  </Text>
                )}
              </Flex>
            )
          }
        />
        <SimpleNavBox
          icon={<AtIcon boxSize={12} />}
          title="Mentions"
          description="See where you've been mentioned"
          to="/notifications/mentions"
          metadata={
            counts.mentions === 0 ? null : (
              <Flex alignItems="center" gap="2">
                <Badge colorScheme={counts.mentions > 0 ? "primary" : "gray"} fontSize="sm">
                  {counts.mentions}
                </Badge>
                {timeRange !== "all" && (
                  <Text fontSize="xs" color="GrayText">
                    {timeRangeLabel}
                  </Text>
                )}
              </Flex>
            )
          }
        />
        <SimpleNavBox
          icon={<ThreadIcon boxSize={12} />}
          title="Threads"
          description="Conversations in your threads"
          to="/notifications/threads"
          metadata={
            counts.threads === 0 ? null : (
              <Flex alignItems="center" gap="2">
                <Badge colorScheme={counts.threads > 0 ? "primary" : "gray"} fontSize="sm">
                  {counts.threads}
                </Badge>
                {timeRange !== "all" && (
                  <Text fontSize="xs" color="GrayText">
                    {timeRangeLabel}
                  </Text>
                )}
              </Flex>
            )
          }
        />
        <SimpleNavBox
          icon={<QuoteIcon boxSize={12} />}
          title="Quotes"
          description="Who has quoted your notes"
          to="/notifications/quotes"
          metadata={
            counts.quotes === 0 ? null : (
              <Flex alignItems="center" gap="2">
                <Badge colorScheme={counts.quotes > 0 ? "primary" : "gray"} fontSize="sm">
                  {counts.quotes}
                </Badge>
                {timeRange !== "all" && (
                  <Text fontSize="xs" color="GrayText">
                    {timeRangeLabel}
                  </Text>
                )}
              </Flex>
            )
          }
        />
        <SimpleNavBox
          icon={<RepostIcon boxSize={12} />}
          title="Reposts"
          description="Who has reposted your notes"
          to="/notifications/reposts"
          metadata={
            counts.reposts === 0 ? null : (
              <Flex alignItems="center" gap="2">
                <Badge colorScheme={counts.reposts > 0 ? "primary" : "gray"} fontSize="sm">
                  {counts.reposts}
                </Badge>
                {timeRange !== "all" && (
                  <Text fontSize="xs" color="GrayText">
                    {timeRangeLabel}
                  </Text>
                )}
              </Flex>
            )
          }
        />
        <SimpleNavBox
          icon={<LightningIcon boxSize={12} />}
          title="Zaps"
          description="Lightning payments you've received"
          to="/notifications/zaps"
          metadata={
            counts.zaps === 0 ? null : (
              <Flex alignItems="center" gap="2">
                <Badge colorScheme={counts.zaps > 0 ? "primary" : "gray"} fontSize="sm">
                  {counts.zaps}
                </Badge>
                {timeRange !== "all" && (
                  <Text fontSize="xs" color="GrayText">
                    {timeRangeLabel}
                  </Text>
                )}
              </Flex>
            )
          }
        />
      </SimpleGrid>
    </SimpleView>
  );
}
