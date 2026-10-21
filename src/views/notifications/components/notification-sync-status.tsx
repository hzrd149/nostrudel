import { IconButton, Text, Tooltip } from "@chakra-ui/react";

import RefreshCcw01 from "../../../components/icons/refresh-ccw-01";
import { getNotificationSyncSummary, NotificationSyncState } from "../../../helpers/notification-sync";

export default function NotificationSyncStatus({ states }: { states: (NotificationSyncState | undefined)[] }) {
  const summaries = states.map(getNotificationSyncSummary);
  const loading = summaries.some((summary) => summary.loading);
  const incomplete = summaries.some((summary) => summary.incomplete || summary.noRelays);
  const status = loading ? "Syncing…" : incomplete ? "Sync incomplete" : "Synced";

  return (
    <>
      <Text as="output" aria-live="polite" color="GrayText" whiteSpace="nowrap">
        {status}
      </Text>
      <Tooltip label={incomplete ? "Retry notification sync" : "Refresh notifications"}>
        <IconButton
          aria-label="Refresh notifications"
          icon={<RefreshCcw01 />}
          variant="ghost"
          isLoading={loading}
          isDisabled={!states.some(Boolean)}
          onClick={() => states.forEach((state) => state?.retry())}
        />
      </Tooltip>
    </>
  );
}
