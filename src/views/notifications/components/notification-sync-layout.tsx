import { Box, Button, ButtonGroup, Flex } from "@chakra-ui/react";
import { ReactNode } from "react";

import { getNotificationSyncSummary, NotificationSyncState } from "../../../helpers/notification-sync";
import NotificationSyncStatus from "./notification-sync-status";

export default function NotificationSyncLayout({
  state,
  empty,
  children,
}: {
  state: NotificationSyncState | undefined;
  empty: boolean;
  children: ReactNode;
}) {
  const { loading, incomplete, noRelays } = getNotificationSyncSummary(state);
  return (
    <Flex direction="column" flex={1} minH={0}>
      <NotificationSyncStatus state={state} />
      <Box flex={1} minH={0}>
        {empty ? (
          <Box mt="4" textAlign="center">
            {loading
              ? "Loading notifications…"
              : incomplete || noRelays
                ? "No notifications loaded"
                : "No notifications in this period"}
          </Box>
        ) : (
          children
        )}
      </Box>
      <ButtonGroup m="4">
        <Button onClick={state?.loadMore} isLoading={loading} isDisabled={!state || noRelays || state.since === 0}>
          Load older
        </Button>
        {(incomplete || noRelays) && (
          <Button onClick={state?.retry} isDisabled={loading}>
            Retry
          </Button>
        )}
      </ButtonGroup>
    </Flex>
  );
}
