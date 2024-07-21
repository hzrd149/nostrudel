import { Outlet, Link as RouterLink, useLocation } from "react-router-dom";
import { Button, Flex, Spinner } from "@chakra-ui/react";

import VerticalPageLayout from "../../components/vertical-page-layout";
import useCurrentAccount from "../../hooks/use-current-account";
import useUserRelaySets from "../../hooks/use-user-relay-sets";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import Database01 from "../../components/icons/database-01";
import { AtIcon, RelayIcon } from "../../components/icons";
import Mail02 from "../../components/icons/mail-02";
import { useUserDNSIdentity } from "../../hooks/use-user-dns-identity";
import useUserContactRelays from "../../hooks/use-user-contact-relays";
import UserSquare from "../../components/icons/user-square";
import Image01 from "../../components/icons/image-01";
import Server05 from "../../components/icons/server-05";
import { Suspense } from "react";

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
        <Button
          as={RouterLink}
          variant="outline"
          colorScheme={
            (location.pathname === "/relays" && !vertical) || location.pathname === "/relays/app"
              ? "primary"
              : undefined
          }
          to="/relays/app"
          leftIcon={<RelayIcon boxSize={6} />}
        >
          App Relays
        </Button>
        <Button
          as={RouterLink}
          variant="outline"
          colorScheme={location.pathname.startsWith("/relays/cache") ? "primary" : undefined}
          to="/relays/cache"
          leftIcon={<Database01 boxSize={6} />}
        >
          Cache Relay
        </Button>
        {account && (
          <>
            <Button
              variant="outline"
              as={RouterLink}
              to="/relays/mailboxes"
              leftIcon={<Mail02 boxSize={6} />}
              colorScheme={location.pathname.startsWith("/relays/mailboxes") ? "primary" : undefined}
            >
              Mailboxes
            </Button>
            <Button
              variant="outline"
              as={RouterLink}
              to="/relays/media-servers"
              leftIcon={<Image01 boxSize={6} />}
              colorScheme={location.pathname.startsWith("/relays/media-servers") ? "primary" : undefined}
            >
              Media Servers
            </Button>
          </>
        )}
        {/* <Button
          variant="outline"
          as={RouterLink}
          to="/relays/webrtc"
          leftIcon={<Server05 boxSize={6} />}
          colorScheme={location.pathname.startsWith("/relays/webrtc") ? "primary" : undefined}
        >
          WebRTC Relays
        </Button> */}
        {nip05?.exists && (
          <Button
            variant="outline"
            as={RouterLink}
            to="/relays/nip05"
            leftIcon={<AtIcon boxSize={6} />}
            colorScheme={location.pathname.startsWith("/relays/nip05") ? "primary" : undefined}
          >
            NIP-05 Relays
          </Button>
        )}
        <Button
          variant="outline"
          as={RouterLink}
          to="/relays/contacts"
          leftIcon={<UserSquare boxSize={6} />}
          colorScheme={location.pathname.startsWith("/relays/contacts") ? "primary" : undefined}
        >
          Contact List Relays
        </Button>
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
