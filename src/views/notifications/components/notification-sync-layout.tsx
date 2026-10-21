import { Box, Flex, Spinner } from "@chakra-ui/react";
import { ReactNode, useCallback } from "react";
import { ListOnItemsRenderedProps } from "react-window";

import { getNotificationSyncSummary, NotificationSyncState } from "../../../helpers/notification-sync";

/** Returns an onItemsRendered handler that loads older notifications once the last item is visible */
export function useLoadOlderOnScrollEnd(state: NotificationSyncState | undefined, itemCount: number) {
  const loadMore = state?.loadMore;
  return useCallback(
    ({ visibleStopIndex }: ListOnItemsRenderedProps) => {
      if (itemCount > 0 && visibleStopIndex >= itemCount - 1) loadMore?.();
    },
    [loadMore, itemCount],
  );
}

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
      {loading && !empty && (
        <Flex justifyContent="center" p="2">
          <Spinner size="sm" />
        </Flex>
      )}
    </Flex>
  );
}
