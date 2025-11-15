import { Box, Button, Card, CardBody, CardHeader, CardProps, Heading, Link } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { useMemo, useState } from "react";

import { ErrorBoundary } from "../../../components/error-boundary";
import RouterLink from "../../../components/router-link";
import DirectReplyCard from "../../notifications/threads/components/direct-reply-card";
import ThreadGroup from "../../notifications/threads/components/thread-group";
import { threadNotifications$ } from "../../../services/notifications";
import TimePeriodSelect, { getTimePeriodLabel, getTimePeriodTimestamp, TimePeriod } from "./time-period-select";
import { ThreadNotification } from "../../notifications/threads/helpers";

export default function ThreadsCard({ ...props }: Omit<CardProps, "children">) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("lastWeek");

  // Get thread notifications from the observable
  const allThreads = useObservableEagerState(threadNotifications$) ?? [];

  // Filter threads by the selected time period and limit to 10
  const threads = useMemo<ThreadNotification[]>(() => {
    const cutoffTimestamp = getTimePeriodTimestamp(timePeriod);

    return allThreads.filter((notification) => notification.timestamp >= cutoffTimestamp).slice(0, 10); // Show only the 10 most recent threads
  }, [allThreads, timePeriod]);

  return (
    <Card variant="outline" {...props}>
      <CardHeader display="flex" justifyContent="space-between" alignItems="center" gap="2">
        <Heading size="md">
          <Link as={RouterLink} to="/notifications/threads">
            Threads
          </Link>
        </Heading>
        <TimePeriodSelect value={timePeriod} onChange={setTimePeriod} />
      </CardHeader>
      <CardBody p="0" overflowY="auto" maxH="50vh" borderTopWidth={1}>
        {threads.length > 0 ? (
          <>
            {threads.map((notification) => (
              <ErrorBoundary key={notification.data.key}>
                {notification.type === "direct" ? (
                  <DirectReplyCard reply={notification.data} />
                ) : (
                  <ThreadGroup group={notification.data} />
                )}
              </ErrorBoundary>
            ))}
            <Button as={RouterLink} to="/notifications/threads" w="full" flexShrink={0} variant="link" size="lg" py="4">
              View All Threads
            </Button>
          </>
        ) : (
          <Box p="4" textAlign="center" color="gray.500">
            No thread activity {getTimePeriodLabel(timePeriod).toLowerCase()}
          </Box>
        )}
      </CardBody>
    </Card>
  );
}
