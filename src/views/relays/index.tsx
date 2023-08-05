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

export default function RelaysView() {
  const [search, setSearch] = useState("");
  const deboundedSearch = useDeferredValue(search);
  const isSearching = deboundedSearch.length > 2;
  const showAll = useDisclosure();
  const addRelayModal = useDisclosure();

  const clientRelays = useClientRelays().map((r) => r.url);
  const discoveredRelays = relayPoolService
    .getRelays()
    .filter((r) => !clientRelays.includes(r.url))
    .map((r) => r.url)
    .filter(safeRelayUrl);
  const { value: onlineRelays = [] } = useAsync(async () =>
    fetch("https://api.nostr.watch/v1/online").then((res) => res.json() as Promise<string[]>)
  );

  const filteredRelays = useMemo(() => {
    if (isSearching) {
      return onlineRelays.filter((url) => url.includes(deboundedSearch));
    }

    return showAll.isOpen ? onlineRelays : clientRelays;
  }, [isSearching, deboundedSearch, onlineRelays, clientRelays, showAll.isOpen]);

  return (
    <Flex direction="column" gap="2" p="2">
      <Flex alignItems="center" gap="2">
        <Input type="search" placeholder="search" value={search} onChange={(e) => setSearch(e.target.value)} w="auto" />
        <Switch isChecked={showAll.isOpen} onChange={showAll.onToggle}>
          Show All
        </Switch>
        <Spacer />
        <Button as={RouterLink} to="/relays/reviews">
          Browse Reviews
        </Button>
        <Button colorScheme="brand" onClick={addRelayModal.onOpen}>
          Add Custom
        </Button>
      </Flex>
      <SimpleGrid minChildWidth="25rem" spacing="2">
        {filteredRelays.map((url) => (
          <RelayCard key={url} url={url} variant="outline" maxW="xl" />
        ))}
      </SimpleGrid>

      {discoveredRelays && !isSearching && (
        <>
          <Divider />
          <Heading size="lg">Discovered Relays</Heading>
          <SimpleGrid minChildWidth="25rem" spacing="2">
            {discoveredRelays.map((url) => (
              <RelayCard key={url} url={url} variant="outline" maxW="xl" />
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
    </Flex>
  );
}
