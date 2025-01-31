import { Badge, Box, Flex, Link, Spacer } from "@chakra-ui/react";

import useRelayAuthState from "../../hooks/use-relay-auth-state";
import RelayFavicon from "../relay-favicon";
import RelayAuthModeSelect from "./relay-auth-mode-select";
import { RelayAuthIconButton } from "./relay-auth-icon-button";
import RouterLink from "../router-link";

export default function RelayAuthCard({ relay }: { relay: string }) {
  const state = useRelayAuthState(relay);

  let badgeColor = "gray";
  switch (state?.status) {
    case "signing":
      badgeColor = "blue";
      break;
    case "requested":
      badgeColor = "orange";
      break;
    case "rejected":
      badgeColor = "red";
      break;
    case "success":
      badgeColor = "green";
      break;
  }

  return (
    <Flex gap="2" p="2" alignItems="center" borderWidth={1} rounded="md">
      <RelayFavicon relay={relay} size="sm" mx="2" showStatus />
      <Flex direction="column" overflow="hidden" alignItems="flex-start">
        <Link as={RouterLink} to={`/relays/${encodeURIComponent(relay)}`} fontWeight="bold" isTruncated>
          {relay}
        </Link>
        <Badge colorScheme={badgeColor}>{state?.status}</Badge>
      </Flex>

      <Spacer />
      <RelayAuthIconButton relay={relay} variant="ghost" flexShrink={0} />
      <RelayAuthModeSelect size="sm" w="auto" rounded="md" flexShrink={0} relay={relay} />
    </Flex>
  );
}
