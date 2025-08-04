import { Box, Flex, Link, Text, VStack } from "@chakra-ui/react";

import RelayFavicon from "../../../components/relay/relay-favicon";
import { RelayAuthIconButton } from "../../../components/relays/relay-auth-icon-button";
import RelayStatusBadge from "../../../components/relays/relay-status";
import RouterLink from "../../../components/router-link";
import { useObservableEagerMemo } from "applesauce-react/hooks";
import pool from "../../../services/pool";
import RelayLink from "../../../components/relay/relay-link";

function InboxRelayStatus({ relay }: { relay: string }) {
  const response = useObservableEagerMemo(() => pool.relay(relay).authenticationResponse$, [relay]);

  return (
    <Flex gap="2" w="full" overflow="hidden" alignItems="flex-start">
      <RelayFavicon relay={relay} size="xs" mt="1" />
      <Box overflow="hidden" w="full">
        <RelayLink relay={relay} isTruncated fontWeight="bold" />
        {response && (
          <Text fontSize="sm" color={response.ok ? "green.500" : "red.500"}>
            {response.message || (response.ok ? "Authenticated" : "Failed")}
          </Text>
        )}
      </Box>
      <Box display="flex" gap="2" alignItems="center">
        <RelayStatusBadge relay={relay} />
        <RelayAuthIconButton relay={relay} size="sm" />
      </Box>
    </Flex>
  );
}

interface InboxesStatusSectionProps {
  relays: string[];
}

export default function InboxesStatusSection({ relays }: InboxesStatusSectionProps) {
  if (!relays || relays.length === 0) return null;

  return (
    <VStack spacing={2} align="stretch">
      {relays.map((relay) => (
        <InboxRelayStatus key={relay} relay={relay} />
      ))}
    </VStack>
  );
}
