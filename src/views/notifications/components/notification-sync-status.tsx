import { Text } from "@chakra-ui/react";
import { getNotificationSyncSummary, NotificationSyncState } from "../../../helpers/notification-sync";

export default function NotificationSyncStatus({ state }: { state: NotificationSyncState | undefined }) {
  const { loading, incomplete, noRelays } = getNotificationSyncSummary(state);
  return (
    <>
      {loading && (
        <Text as="output" aria-live="polite" px="4">
          Syncing notifications…
        </Text>
      )}
      {incomplete && (
        <Text as="output" aria-live="polite" px="4">
          Some notifications could not be loaded. Check your relay connections or retry.
        </Text>
      )}
      {noRelays && (
        <Text as="output" aria-live="polite" px="4">
          Some notification sources have no relays. Check your mailbox settings.
        </Text>
      )}
    </>
  );
}
