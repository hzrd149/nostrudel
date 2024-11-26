import { Divider, Flex, Heading, Link } from "@chakra-ui/react";
import { Outlet, useMatch } from "react-router-dom";

import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import SimpleNavItem from "../../components/simple-nav-item";
import { ErrorBoundary } from "../../components/error-boundary";
import {
  AppearanceIcon,
  DatabaseIcon,
  GithubIcon,
  LightningIcon,
  NotesIcon,
  PerformanceIcon,
  SpyIcon,
} from "../../components/icons";
import useCurrentAccount from "../../hooks/use-current-account";
import Image01 from "../../components/icons/image-01";
import UserAvatar from "../../components/user/user-avatar";
import VersionButton from "../../components/version-button";

export default function SettingsView() {
  const account = useCurrentAccount();
  const match = useMatch("/settings");
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const showMenu = !isMobile || !!match;

  if (showMenu) {
    return (
      <Flex overflow="hidden" flex={1} direction={{ base: "column", lg: "row" }}>
        <Flex overflowY="auto" overflowX="hidden" h="full" minW="xs" direction="column">
          <Heading title="Settings" />
          <Flex direction="column" p="2" gap="2">
            {account && (
              <SimpleNavItem to="/settings/accounts" leftIcon={<UserAvatar size="xs" pubkey={account.pubkey} />}>
                Accounts
              </SimpleNavItem>
            )}
            <SimpleNavItem to="/settings/display" leftIcon={<AppearanceIcon boxSize={5} />}>
              Display
            </SimpleNavItem>
            <SimpleNavItem to="/settings/post" leftIcon={<NotesIcon boxSize={5} />}>
              Posts
            </SimpleNavItem>
            {account && (
              <>
                <SimpleNavItem to="/settings/media-servers" leftIcon={<Image01 boxSize={6} />}>
                  Media Servers
                </SimpleNavItem>
              </>
            )}
            <SimpleNavItem to="/settings/performance" leftIcon={<PerformanceIcon boxSize={5} />}>
              Performance
            </SimpleNavItem>
            <SimpleNavItem to="/settings/lightning" leftIcon={<LightningIcon boxSize={5} />}>
              Lightning
            </SimpleNavItem>
            <SimpleNavItem to="/settings/privacy" leftIcon={<SpyIcon boxSize={5} />}>
              Privacy
            </SimpleNavItem>
            <SimpleNavItem to="/relays/cache/database" leftIcon={<DatabaseIcon boxSize={5} />}>
              Database Tools
            </SimpleNavItem>

            <Divider />

            <Flex alignItems="center">
              <Link isExternal href="https://github.com/hzrd149/nostrudel" flex={1}>
                <GithubIcon /> Github
              </Link>
              <VersionButton />
            </Flex>
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
