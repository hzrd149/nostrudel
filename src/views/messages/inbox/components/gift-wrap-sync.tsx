import { Button, Flex, Select, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useState } from "react";
import { combineLatest } from "rxjs";
import useMessaging from "../../../../hooks/use-messaging";

const DAY = 86400;
const SPANS = [
  ["Last month", 30 * DAY],
  ["Last 6 months", 182 * DAY],
  ["Last year", 365 * DAY],
  ["All time", 0],
] as const;

/** Both protocols reconcile through their clients; cancelling unsubscribes the sync work. */
export default function GiftWrapSync() {
  const session = useMessaging();
  const [span, setSpan] = useState<number>(30 * DAY);
  const [run, setRun] = useState<{ since: number }>();
  const status = use$(
    () =>
      session && run
        ? combineLatest([
            session.legacy.sync$({ since: run.since, followRelays: false }),
            session.wrapped.sync$({ since: run.since }),
          ])
        : undefined,
    [session, run],
  );
  const running = !!run && !status?.every((result) => result.done);
  return (
    <Flex direction="column" gap="2">
      <Flex gap="2">
        <Select
          aria-label="Sync message history"
          value={span}
          onChange={(e) => setSpan(Number(e.target.value))}
          isDisabled={running}
        >
          {SPANS.map(([label, value]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        {running ? (
          <Button onClick={() => setRun(undefined)}>Cancel</Button>
        ) : (
          <Button
            isDisabled={!session}
            onClick={() => setRun({ since: span ? Math.floor(Date.now() / 1000) - span : 0 })}
          >
            Sync history
          </Button>
        )}
      </Flex>
      {running && <Text>Syncing history…</Text>}
    </Flex>
  );
}
