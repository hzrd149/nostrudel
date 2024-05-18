import { useCallback, useEffect, useState } from "react";
import { ButtonGroup, Card, Flex, Heading, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { localRelay } from "../../../../services/local-relay";
import WasmRelay from "../../../../services/wasm-relay";
import EventKindsPieChart from "../../../../components/charts/event-kinds-pie-chart";
import EventKindsTable from "../../../../components/charts/event-kinds-table";
import ImportEventsButton from "./components/import-events-button";
import ExportEventsButton from "./components/export-events-button";

export default function WasmDatabasePage() {
  const relay = localRelay;
  if (!(relay instanceof WasmRelay)) return null;
  const worker = relay.worker;
  if (!worker) return null;

  const [summary, setSummary] = useState<Record<string, number>>();

  const total = summary ? Object.values(summary).reduce((t, v) => t + v, 0) : undefined;

  const refresh = useCallback(async () => {
    await worker.summary().then((v) => setSummary(v));
  }, [setSummary, worker]);

  const importEvents = useCallback(
    async (events: NostrEvent[]) => {
      const batchSize = 100;
      const queue = Array.from(events);

      const next = () => {
        const p: Promise<any>[] = [];
        for (let i = 0; i < batchSize; i++) {
          const event = queue.pop();
          if (!event) break;
          p.push(worker.event(event));
        }

        return Promise.all(p);
      };

      while (queue.length > 0) {
        await next();
        await refresh();
      }
    },
    [worker],
  );
  const exportEvents = useCallback(async () => {
    return worker.query(["REQ", "export", {}]);
  }, [worker]);

  useEffect(() => {
    refresh();
  }, []);

  return (
    <>
      <Text>Wasm Relay Database</Text>
      <Text>Total events: {total ?? "Loading..."}</Text>
      <ButtonGroup flexWrap="wrap">
        <ImportEventsButton onLoad={importEvents} />
        <ExportEventsButton getEvents={exportEvents} />
      </ButtonGroup>
      <Flex gap="2" wrap="wrap" alignItems="flex-start" w="full">
        {summary && (
          <>
            <Card p="2" minW="sm" maxW="lg" flex={1}>
              <Heading size="sm">Events by kind</Heading>
              <EventKindsPieChart kinds={summary} />
            </Card>
            <Card p="2" minW="sm" maxW="md" flex={1}>
              <EventKindsTable kinds={summary} />
            </Card>
          </>
        )}
      </Flex>
    </>
  );
}
