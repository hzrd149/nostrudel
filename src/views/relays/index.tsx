import { useDeferredValue, useMemo, useState } from "react";
import { useAsync } from "react-use";
import { Link as RouterLink } from "react-router-dom";
import { Button, Divider, Flex, Heading, Input, SimpleGrid, Spacer, Switch, useDisclosure } from "@chakra-ui/react";

import { useClientRelays } from "../../hooks/use-client-relays";
import relayPoolService from "../../services/relay-pool";
import { safeRelayUrl } from "../../helpers/url";
import AddCustomRelayModal from "./components/add-custom-modal";
import RelayCard from "./components/relay-card";
import clientRelaysService from "../../services/client-relays";
import { RelayMode } from "../../classes/relay";
import { ErrorBoundary } from "../../components/error-boundary";
import VerticalPageLayout from "../../components/vertical-page-layout";

export default function RelaysView() {
  const [search, setSearch] = useState("");
  const deboundedSearch = useDeferredValue(search);
  const isSearching = deboundedSearch.length > 2;
  const addRelayModal = useDisclosure();

  const clientRelays = useClientRelays().map((r) => r.url);
  const discoveredRelays = relayPoolService
    .getRelays()
    .filter((r) => !clientRelays.includes(r.url))
    .map((r) => r.url)
    .filter(safeRelayUrl);
  const { value: onlineRelays = [] } = useAsync(async () =>
    fetch("https://api.nostr.watch/v1/online").then((res) => res.json() as Promise<string[]>),
  );

  const filteredRelays = useMemo(() => {
    if (isSearching) {
      return onlineRelays.filter((url) => url.includes(deboundedSearch));
    }

    return clientRelays;
  }, [isSearching, deboundedSearch, onlineRelays, clientRelays]);

  return (
    <VerticalPageLayout>
      <Flex alignItems="center" gap="2" wrap="wrap">
        <Input type="search" placeholder="search" value={search} onChange={(e) => setSearch(e.target.value)} w="auto" />
        <Spacer />
        <Button as={RouterLink} to="/relays/reviews">
          Browse Reviews
        </Button>
        <Button colorScheme="brand" onClick={addRelayModal.onOpen}>
          Add Custom
        </Button>
      </Flex>
      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
        {filteredRelays.map((url) => (
          <ErrorBoundary>
            <RelayCard key={url} url={url} variant="outline" />
          </ErrorBoundary>
        ))}
      </SimpleGrid>

      {discoveredRelays && !isSearching && (
        <>
          <Divider />
          <Heading size="lg">Discovered Relays</Heading>
          <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
            {discoveredRelays.map((url) => (
              <ErrorBoundary>
                <RelayCard key={url} url={url} variant="outline" />
              </ErrorBoundary>
            ))}
          </SimpleGrid>
        </>
      )}

      {addRelayModal.isOpen && (
        <AddCustomRelayModal
          isOpen
          onClose={addRelayModal.onClose}
          size="2xl"
          onSubmit={(url) => {
            clientRelaysService.addRelay(url, RelayMode.ALL);
            addRelayModal.onClose();
          }}
        />
      )}
    </VerticalPageLayout>
  );
}
