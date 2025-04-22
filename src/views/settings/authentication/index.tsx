import { FormControl, FormLabel, Heading, SimpleGrid } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import DefaultAuthModeSelect from "../../../components/settings/default-auth-mode-select";
import SimpleView from "../../../components/layout/presets/simple-view";
import { connections$ } from "../../../services/rx-nostr";
import RelayAuthCard from "../../../components/relays/relay-auth-card";

export default function AuthenticationSettingsView() {
  const connections = useObservable(connections$);
  const sortedRelays = Object.keys(connections).sort();

  return (
    <SimpleView title="Authentication settings" maxW="6xl">
      <FormControl>
        <FormLabel htmlFor="default-mode">Default mode</FormLabel>
        <DefaultAuthModeSelect id="default-mode" w="sm" />
      </FormControl>

      <Heading size="md" mt="4">
        Relay mode
      </Heading>
      <SimpleGrid spacing="2" columns={{ base: 1, md: 2 }}>
        {sortedRelays.map((relay) => (
          <RelayAuthCard key={relay} relay={relay} />
        ))}
      </SimpleGrid>
    </SimpleView>
  );
}
