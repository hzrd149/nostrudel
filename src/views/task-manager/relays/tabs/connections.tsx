import { Flex, Link, SimpleGrid, Spacer } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import { connections$ } from "../../../../services/pool";
import RelayFavicon from "../../../../components/relay-favicon";
import RouterLink from "../../../../components/router-link";
import { RelayAuthIconButton } from "../../../../components/relays/relay-auth-icon-button";
import RelayStatusBadge from "../../../../components/relays/relay-status";
import { getConnectionStateSort } from "../../../../helpers/relay";

function RelayCard({ relay }: { relay: string }) {
  return (
    <Flex gap="2" p="2" alignItems="center" borderWidth={1} rounded="md">
      <RelayFavicon relay={relay} size="sm" showStatus />
      <Link as={RouterLink} to={`/relays/${encodeURIComponent(relay)}`} isTruncated fontWeight="bold" py="1" pr="5">
        {relay}
      </Link>
      <Spacer />
      <RelayAuthIconButton relay={relay} size="sm" variant="ghost" />
      <RelayStatusBadge relay={relay} />
    </Flex>
  );
}

export default function RelayConnectionsTab() {
  const connections = useObservable(connections$) ?? {};

  return (
    <Flex direction="column">
      <SimpleGrid spacing="2" columns={{ base: 1, md: 2 }} p="2">
        {Object.entries(connections)
          .sort((a, b) => getConnectionStateSort(a[1]) - getConnectionStateSort(b[1]) || a[0].localeCompare(b[0]))
          .map(([relay]) => (
            <RelayCard key={relay} relay={relay} />
          ))}
      </SimpleGrid>
    </Flex>
  );
}
