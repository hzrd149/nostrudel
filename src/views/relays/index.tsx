import { useState } from "react";
import { Outlet, Link as RouterLink, useLocation, useMatch } from "react-router-dom";
import { Button, Divider, Flex, Heading, VStack } from "@chakra-ui/react";

import VerticalPageLayout from "../../components/vertical-page-layout";
import useCurrentAccount from "../../hooks/use-current-account";
import useUserRelaySets from "../../hooks/use-user-relay-sets";
import { getListName } from "../../helpers/nostr/lists";
import { getEventCoordinate } from "../../helpers/nostr/events";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import BackButton from "../../components/back-button";
import Database01 from "../../components/icons/database-01";
import { RelayIcon } from "../../components/icons";

export default function RelaysView() {
  const account = useCurrentAccount();
  const relaySets = useUserRelaySets(account?.pubkey, undefined);
  const vertical = useBreakpointValue({ base: true, lg: false });

  const location = useLocation();

  const renderContent = () => {
    const nav = (
      <Flex gap="2" direction="column" minW="60" overflowY="auto" overflowX="hidden" w={vertical ? "full" : undefined}>
        <Button
          as={RouterLink}
          variant="outline"
          colorScheme={
            (location.pathname === "/relays" && !vertical) || location.pathname === "/relays/app"
              ? "primary"
              : undefined
          }
          to="/relays/app"
          leftIcon={<RelayIcon />}
        >
          App Relays
        </Button>
        <Button
          as={RouterLink}
          variant="outline"
          colorScheme={location.pathname === "/relays/cache" ? "primary" : undefined}
          to="/relays/cache"
          leftIcon={<Database01 />}
        >
          Cache Relay
        </Button>
        {account && (
          <>
            <Heading size="sm" mt="2">
              Relay Sets
            </Heading>
            {relaySets.map((set) => (
              <Button
                as={RouterLink}
                variant="outline"
                colorScheme={location.pathname.endsWith(getEventCoordinate(set)) ? "primary" : undefined}
                to={`/relays/${getEventCoordinate(set)}`}
              >
                {getListName(set)}
              </Button>
            ))}
          </>
        )}
      </Flex>
    );
    if (vertical) {
      if (location.pathname !== "/relays") return <Outlet />;
      else return nav;
    } else
      return (
        <Flex gap="2" maxH="100vh" overflow="hidden">
          {nav}
          <Outlet />
        </Flex>
      );
  };

  return <VerticalPageLayout>{renderContent()}</VerticalPageLayout>;
}
