import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Flex, Spinner } from "@chakra-ui/react";

import VerticalPageLayout from "../../components/vertical-page-layout";
import useCurrentAccount from "../../hooks/use-current-account";
import useUserRelaySets from "../../hooks/use-user-relay-sets";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import Database01 from "../../components/icons/database-01";
import { AtIcon, RelayIcon, SearchIcon } from "../../components/icons";
import Mail02 from "../../components/icons/mail-02";
import { useUserDNSIdentity } from "../../hooks/use-user-dns-identity";
import useUserContactRelays from "../../hooks/use-user-contact-relays";
import UserSquare from "../../components/icons/user-square";
import Image01 from "../../components/icons/image-01";
import Server05 from "../../components/icons/server-05";
import SimpleNavItem from "../../components/layout/presets/simple-nav-item";

export default function RelaysView() {
  const account = useCurrentAccount();
  const relaySets = useUserRelaySets(account?.pubkey, undefined);
  const vertical = useBreakpointValue({ base: true, lg: false });
  const nip05 = useUserDNSIdentity(account?.pubkey);
  const kind3Relays = useUserContactRelays(account?.pubkey);

  const location = useLocation();

  const renderContent = () => {
    const nav = (
      <Flex gap="2" direction="column" minW="60" overflowY="auto" overflowX="hidden" w={vertical ? "full" : undefined}>
        <SimpleNavItem to="/relays/app" leftIcon={<RelayIcon boxSize={6} />}>
          App Relays
        </SimpleNavItem>
        <SimpleNavItem to="/relays/cache" leftIcon={<Database01 boxSize={6} />}>
          Cache Relay
        </SimpleNavItem>
        {account && (
          <>
            <SimpleNavItem to="/relays/mailboxes" leftIcon={<Mail02 boxSize={6} />}>
              Mailboxes
            </SimpleNavItem>
            <SimpleNavItem to="/relays/media-servers" leftIcon={<Image01 boxSize={6} />}>
              Media Servers
            </SimpleNavItem>
            <SimpleNavItem to="/relays/search" leftIcon={<SearchIcon boxSize={6} />}>
              Search Relays
            </SimpleNavItem>
          </>
        )}
        <SimpleNavItem to="/relays/webrtc" leftIcon={<Server05 boxSize={6} />}>
          WebRTC Relays
        </SimpleNavItem>
        {nip05?.exists && (
          <SimpleNavItem to="/relays/nip05" leftIcon={<AtIcon boxSize={6} />}>
            NIP-05 Relays
          </SimpleNavItem>
        )}
        {account && (
          <>
            <SimpleNavItem to="/relays/contacts" leftIcon={<UserSquare boxSize={6} />}>
              Contact List Relays
            </SimpleNavItem>
          </>
        )}
        {/* {account && (
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
        )} */}
      </Flex>
    );

    if (vertical) {
      if (location.pathname !== "/relays") return <Outlet />;
      else return nav;
    } else
      return (
        <Flex gap="2" minH="100vh" overflow="hidden">
          {nav}
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </Flex>
      );
  };

  return <VerticalPageLayout>{renderContent()}</VerticalPageLayout>;
}
