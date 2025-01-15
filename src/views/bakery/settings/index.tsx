import { Divider, Flex, Text } from "@chakra-ui/react";
import { Outlet, useMatch } from "react-router-dom";

import SimpleHeader from "../../../components/layout/presets/simple-header";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import SimpleNavItem from "../../../components/layout/presets/simple-nav-item";
import { ErrorBoundary } from "../../../components/error-boundary";

export default function SettingsView() {
  const match = useMatch("/settings");
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const showMenu = !isMobile || !!match;

  if (showMenu) {
    return (
      <Flex overflow="hidden" flex={1} direction={{ base: "column", lg: "row" }}>
        <Flex overflowY="auto" overflowX="hidden" h="full" minW="xs" direction="column">
          <SimpleHeader title="Settings" />
          <Flex direction="column" p="2" gap="2">
            <SimpleNavItem to="/settings/display">Display</SimpleNavItem>
            <SimpleNavItem to="/settings/notifications">Notifications</SimpleNavItem>
            <Flex alignItems="center" gap="2">
              <Divider />
              <Text fontWeight="bold" fontSize="md">
                Node
              </Text>
              <Divider />
            </Flex>
            <SimpleNavItem to="/settings/general">General</SimpleNavItem>
            <SimpleNavItem to="/settings/networking">Network</SimpleNavItem>
            <SimpleNavItem to="/settings/logs">Service Logs</SimpleNavItem>
          </Flex>
        </Flex>
        {!isMobile && (
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        )}
      </Flex>
    );
  }

  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  );
}
