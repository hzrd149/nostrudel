import { Flex, FormControl, FormHelperText, FormLabel, Heading, SimpleGrid, Switch } from "@chakra-ui/react";
import { useObservableEagerState, useObservableState } from "applesauce-react/hooks";

import SimpleView from "../../../components/layout/presets/simple-view";
import RelayAuthCard from "../../../components/relays/relay-auth-card";
import DefaultAuthModeSelect from "../../../components/settings/default-auth-mode-select";
import localSettings from "../../../services/preferences";
import { connections$ } from "../../../services/pool";

export default function AuthenticationSettingsView() {
  const connections = useObservableState(connections$) ?? {};
  const sortedRelays = Object.keys(connections).sort();

  const proactivelyAuthenticate = useObservableEagerState(localSettings.proactivelyAuthenticate);

  return (
    <SimpleView title="Authentication settings" maxW="6xl">
      <FormControl>
        <FormLabel htmlFor="default-mode">Default mode</FormLabel>
        <DefaultAuthModeSelect id="default-mode" w="sm" />
      </FormControl>

      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="proactivelyAuthenticate" mb="0">
            Proactively authenticate to relays
          </FormLabel>
          <Switch
            id="proactivelyAuthenticate"
            isChecked={proactivelyAuthenticate}
            onChange={(e) => localSettings.proactivelyAuthenticate.next(e.currentTarget.checked)}
          />
        </Flex>
        <FormHelperText>
          <span>Authenticate to relays as soon as they send the authentication challenge</span>
        </FormHelperText>
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
