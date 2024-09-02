import { PropsWithChildren } from "react";
import { Alert, AlertIcon, Button, Link, Spacer, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useLocation } from "react-router-dom";

import { useReadRelays } from "../../hooks/use-client-relays";
import useSubject from "../../hooks/use-subject";
import { offlineMode } from "../../services/offline-mode";

export default function RequireReadRelays({ children }: PropsWithChildren) {
  const readRelays = useReadRelays();
  const offline = useSubject(offlineMode);
  const location = useLocation();

  if (readRelays.size === 0 && !offline && !location.pathname.startsWith("/relays"))
    return (
      <>
        <Alert status="warning" whiteSpace="pre-wrap" flexWrap="wrap">
          <AlertIcon />
          <Text>
            Missing{" "}
            <Link as={RouterLink} to="/relays/app">
              app relays
            </Link>
            ! Reading and publishing notes wont work very well!
          </Text>
          <Spacer />
          <Button as={RouterLink} to="/relays/app" size="sm" colorScheme="primary">
            Setup Relays
          </Button>
        </Alert>
        {children}
      </>
    );

  return children;
}
