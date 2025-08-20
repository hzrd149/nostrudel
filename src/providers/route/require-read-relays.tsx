import { PropsWithChildren } from "react";
import { Alert, AlertIcon, Button, Link, Spacer, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useLocation } from "react-router-dom";

import { useReadRelays } from "../../hooks/use-client-relays";

export default function RequireReadRelays({ children }: PropsWithChildren) {
  const readRelays = useReadRelays();
  const location = useLocation();

  if (readRelays.length === 0 && !location.pathname.startsWith("/relays"))
    return (
      <>
        <Alert status="warning" whiteSpace="pre-wrap" flexWrap="wrap">
          <AlertIcon />
          <Text>
            Missing{" "}
            <Link as={RouterLink} to="/settings/relays">
              app relays
            </Link>
            ! Reading and publishing notes won't work very well!
          </Text>
          <Spacer />
          <Button as={RouterLink} to="/settings/relays" size="sm" colorScheme="primary">
            Setup Relays
          </Button>
        </Alert>
        {children}
      </>
    );

  return children;
}
