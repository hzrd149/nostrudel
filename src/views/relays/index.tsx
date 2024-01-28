import { useDeferredValue, useMemo, useState } from "react";
import { useAsync } from "react-use";
import { Link as RouterLink } from "react-router-dom";
import { Button, Flex, Heading, Input, SimpleGrid, Spacer, useDisclosure } from "@chakra-ui/react";

import relayPoolService from "../../services/relay-pool";
import AddCustomRelayModal from "./components/add-custom-modal";
import RelayCard from "./components/relay-card";
import clientRelaysService from "../../services/client-relays";
import { RelayMode } from "../../classes/relay";
import { ErrorBoundary } from "../../components/error-boundary";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { isValidRelayURL } from "../../helpers/relay";
import { useReadRelays, useWriteRelays } from "../../hooks/use-client-relays";
import { offlineMode } from "../../services/offline-mode";
import useSubject from "../../hooks/use-subject";

export default function RelaysView() {
  const [search, setSearch] = useState("");
  const deboundedSearch = useDeferredValue(search);
  const isSearching = deboundedSearch.length > 2;
  const addRelayModal = useDisclosure();
  const offline = useSubject(offlineMode);

  const readRelays = useReadRelays();
  const writeRelays = useWriteRelays();
  const discoveredRelays = relayPoolService
    .getRelays()
    .filter((r) => !readRelays.has(r.url) && !writeRelays.has(r.url))
    .map((r) => r.url)
    .filter(isValidRelayURL);

  const { value: onlineRelays = [] } = useAsync(async () =>
    fetch("https://api.nostr.watch/v1/online").then((res) => res.json() as Promise<string[]>),
  );

  const filteredRelays = useMemo(() => {
    if (isSearching) {
      return onlineRelays.filter((url) => url.toLowerCase().includes(deboundedSearch.toLowerCase()));
    }

    return [...readRelays];
  }, [isSearching, deboundedSearch, onlineRelays, readRelays]);

  return (
    <VerticalPageLayout>
      <Flex alignItems="center" gap="2" wrap="wrap">
        <Input type="search" placeholder="search" value={search} onChange={(e) => setSearch(e.target.value)} w="auto" />
        {!offline && <Button onClick={() => offlineMode.next(true)}>Offline</Button>}
        <Spacer />
        <Button as={RouterLink} to="/relays/popular">
          Popular Relays
        </Button>
        <Button as={RouterLink} to="/relays/reviews">
          Browse Reviews
        </Button>
        <Button colorScheme="primary" onClick={addRelayModal.onOpen}>
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

      {discoveredRelays.length > 0 && !isSearching && (
        <>
          <Heading size="lg" my="2">
            Discovered Relays
          </Heading>
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
