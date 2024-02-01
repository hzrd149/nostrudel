import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { CloseIcon } from "@chakra-ui/icons";

import { Button, Flex, Heading, IconButton, Link } from "@chakra-ui/react";
import useSubject from "../../../hooks/use-subject";
import { offlineMode } from "../../../services/offline-mode";
import WifiOff from "../../../components/icons/wifi-off";
import Wifi from "../../../components/icons/wifi";
import BackButton from "../../../components/back-button";
import AddRelayForm from "./add-relay-form";
import relayPoolService from "../../../services/relay-pool";
import clientRelaysService from "../../../services/client-relays";
import { RelayMode } from "../../../classes/relay";
import { RelayFavicon } from "../../../components/relay-favicon";
import UploadCloud01 from "../../../components/icons/upload-cloud-01";
import RelaySet from "../../../classes/relay-set";
import { useReadRelays, useWriteRelays } from "../../../hooks/use-client-relays";
import useCurrentAccount from "../../../hooks/use-current-account";

function RelayControl({ url }: { url: string }) {
  const relay = useMemo(() => relayPoolService.requestRelay(url, false), [url]);
  const status = useSubject(relay.status);
  const writeRelays = useSubject(clientRelaysService.writeRelays);

  let color = "gray";
  switch (status) {
    case WebSocket.OPEN:
      color = "green";
      break;
    case WebSocket.CONNECTING:
      color = "yellow";
      break;
    case WebSocket.CLOSED:
      color = "red";
      break;
  }

  const onChange = () => {
    if (writeRelays.has(url)) clientRelaysService.removeRelay(url, RelayMode.WRITE);
    else clientRelaysService.addRelay(url, RelayMode.WRITE);
  };

  return (
    <Flex gap="2" alignItems="center" pl="2">
      <RelayFavicon relay={url} size="xs" outline="2px solid" outlineColor={color} />
      <Link as={RouterLink} to={`/r/${encodeURIComponent(url)}`} isTruncated>
        {url}
      </Link>
      <IconButton
        ml="auto"
        aria-label="Toggle Write"
        icon={<UploadCloud01 />}
        size="sm"
        variant={writeRelays.has(url) ? "solid" : "ghost"}
        colorScheme={writeRelays.has(url) ? "green" : "gray"}
        onClick={onChange}
        title="Toggle Write"
      />
      <IconButton
        aria-label="Remove Relay"
        icon={<CloseIcon />}
        size="sm"
        colorScheme="red"
        onClick={() => clientRelaysService.removeRelay(url, RelayMode.ALL)}
      />
    </Flex>
  );
}

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
    </Flex>
  );
}
