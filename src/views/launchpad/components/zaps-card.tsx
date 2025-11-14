import { Box, Button, Card, CardBody, CardHeader, CardProps, Heading, Link } from "@chakra-ui/react";
import { isValidZap, ZapEvent } from "applesauce-core/helpers";
import { TimelineModel } from "applesauce-core/models";
import { useActiveAccount, useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { useMemo, useState } from "react";

import { ErrorBoundary } from "../../../components/error-boundary";
import RouterLink from "../../../components/router-link";
import { groupZapsByZappedEvent } from "../../../helpers/nostr/zaps";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { zapNotificationsLoader$ } from "../../../services/notifications";
import ZapGroupComponent from "../../notifications/zaps/components/zap-group";
import TimePeriodSelect, { getTimePeriodLabel, getTimePeriodTimestamp, TimePeriod } from "./time-period-select";

export default function ZapsCard({ ...props }: Omit<CardProps, "children">) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("lastWeek");

  // Get account
  const account = useActiveAccount()!;

  // Get timeline of zap events
  const events = useEventModel(TimelineModel, [{ kinds: [kinds.Zap], "#p": [account.pubkey] }])?.filter(
    (e): e is ZapEvent => {
      try {
        // Ensure the payment can be parsed
        return isValidZap(e);
      } catch (error) {
        return false;
      }
    },
  );

  // Start the zap notifications loader
  const loader = useObservableEagerState(zapNotificationsLoader$);
  const callback = useTimelineCurserIntersectionCallback(loader ?? undefined);

  // Group zaps by the zapped event and filter by time period
  const groups = useMemo(() => {
    const allGroups = groupZapsByZappedEvent(events ?? []);
    const cutoffTimestamp = getTimePeriodTimestamp(timePeriod);
    return allGroups.filter((group) => group.latest >= cutoffTimestamp).slice(0, 10);
  }, [events, timePeriod]);

  return (
    <IntersectionObserverProvider callback={callback}>
      <Card variant="outline" {...props}>
        <CardHeader display="flex" justifyContent="space-between" alignItems="center" gap="2">
          <Heading size="md">
            <Link as={RouterLink} to="/notifications/zaps">
              Zaps
            </Link>
          </Heading>
          <TimePeriodSelect value={timePeriod} onChange={setTimePeriod} />
        </CardHeader>
        <CardBody p="0" overflowY="auto" maxH="50vh" borderTopWidth={1}>
          {groups.length > 0 ? (
            <>
              {groups.map((group) => (
                <ErrorBoundary key={group.key}>
                  <ZapGroupComponent group={group} />
                </ErrorBoundary>
              ))}
              <Button as={RouterLink} to="/notifications/zaps" w="full" flexShrink={0} variant="link" size="lg" py="4">
                View All Zaps
              </Button>
            </>
          ) : (
            <Box p="4" textAlign="center" color="gray.500">
              No zaps {getTimePeriodLabel(timePeriod).toLowerCase()}
            </Box>
          )}
        </CardBody>
      </Card>
    </IntersectionObserverProvider>
  );
}
