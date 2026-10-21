import { Button, Flex, Select, Text } from "@chakra-ui/react";
import { SyncLoaderStatus } from "applesauce-loaders/loaders";
import { use$, useActiveAccount } from "applesauce-react/hooks";
import { useState } from "react";

import { giftWrapStartupSync$, syncGiftWraps } from "../../../../services/wrapped-messages";

const DAY = 24 * 60 * 60;
// How far back the sync can reach, zero syncs the whole history
const SYNC_SPANS = [
  ["Last 6 months", 182 * DAY],
  ["Last year", 365 * DAY],
  ["Last 5 years", 5 * 365 * DAY],
  ["All time", 0],
] as const;

function SyncStatus({ status, label }: { status: SyncLoaderStatus; label: string }) {
  const relays = Object.values(status.relays);
  const finished = relays.filter((r) => r.state === "complete" || r.state === "error").length;
  const failed = relays.filter((r) => r.state === "error");

  return (
    <Flex direction="column">
      <Text fontSize="sm" color="GrayText">
        {status.done ? "Synced" : "Syncing"} {label}: {status.loaded} gift wraps from {finished}/{relays.length} relays
      </Text>
      {failed.map((r) => (
        <Text key={r.relay} fontSize="sm" color="red.500" isTruncated title={r.error?.message}>
          {new URL(r.relay).hostname}: {r.error?.message}
        </Text>
      ))}
    </Flex>
  );
}

/** Shows the startup sync of recent gift wraps and bulk syncs older ones on demand */
export default function GiftWrapSync() {
  const account = useActiveAccount()!;
  const startup = use$(giftWrapStartupSync$);

  const [span, setSpan] = useState<number>(SYNC_SPANS[0][1]);
  const [run, setRun] = useState<{ since: number; label: string }>();
  const status = use$(() => run && syncGiftWraps(account.pubkey, run.since), [run, account.pubkey]);
  const running = !!run && !status?.done;

  const start = () => {
    const label = SYNC_SPANS.find(([, value]) => value === span)?.[0] ?? "";
    setRun({ since: span ? Math.floor(Date.now() / 1000) - span : 0, label: label.toLowerCase() });
  };

  return (
    <Flex direction="column" gap="2">
      {startup && <SyncStatus status={startup} label="last 30 days" />}
      <Flex gap="2">
        <Select
          size="sm"
          value={span}
          onChange={(e) => setSpan(Number(e.target.value))}
          isDisabled={running}
          aria-label="Sync messages from"
        >
          {SYNC_SPANS.map(([label, value]) => (
            <option key={label} value={value}>
              {label}
            </option>
          ))}
        </Select>
        {running ? (
          <Button size="sm" flexShrink={0} onClick={() => setRun(undefined)}>
            Cancel
          </Button>
        ) : (
          <Button size="sm" flexShrink={0} colorScheme="primary" onClick={start}>
            Sync older messages
          </Button>
        )}
      </Flex>
      {run && status && <SyncStatus status={status} label={run.label} />}
    </Flex>
  );
}
