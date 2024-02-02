import { useMemo } from "react";

import { Button, Flex, Heading } from "@chakra-ui/react";
import useSubject from "../../../hooks/use-subject";
import { offlineMode } from "../../../services/offline-mode";
import WifiOff from "../../../components/icons/wifi-off";
import Wifi from "../../../components/icons/wifi";
import BackButton from "../../../components/back-button";
import AddRelayForm from "./add-relay-form";
import clientRelaysService from "../../../services/client-relays";
import { RelayMode } from "../../../classes/relay";
import RelaySet from "../../../classes/relay-set";
import { useReadRelays, useWriteRelays } from "../../../hooks/use-client-relays";
import useCurrentAccount from "../../../hooks/use-current-account";
import RelayControl from "./relay-control";
import SelectRelaySet from "./select-relay-set";

export default function AppRelays() {
  const account = useCurrentAccount();
  const readRelays = useReadRelays();
  const writeRelays = useWriteRelays();
  const offline = useSubject(offlineMode);

  const sorted = useMemo(() => RelaySet.from(readRelays, writeRelays).urls.sort(), [readRelays, writeRelays]);

  return (
    <Flex gap="2" direction="column" overflow="auto hidden" flex={1}>
      <Flex gap="2" alignItems="center">
        <BackButton hideFrom="lg" size="sm" />
        <Heading size="lg">App Relays</Heading>
        <Button
          onClick={() => offlineMode.next(!offline)}
          leftIcon={offline ? <WifiOff /> : <Wifi />}
          ml="auto"
          size={{ base: "sm", lg: "md" }}
        >
          {offline ? "Offline" : "Online"}
        </Button>
      </Flex>

      {sorted.map((url) => (
        <RelayControl key={url} url={url} />
      ))}
      <AddRelayForm
        onSubmit={(url) => {
          clientRelaysService.addRelay(url, RelayMode.ALL);
        }}
      />

      {/* {account && (
        <>
          <Heading size="md" mt="2">
            Use relay set
          </Heading>
          <SelectRelaySet onChange={(cord, set) => set && clientRelaysService.setRelaysFromRelaySet(set)} />
        </>
      )} */}
    </Flex>
  );
}
