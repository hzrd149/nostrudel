import { useMemo } from "react";
import { Link as RouterLink } from "react-router";
import { CloseIcon } from "@chakra-ui/icons";
import { useObservable } from "applesauce-react/hooks";

import { Flex, IconButton, Link } from "@chakra-ui/react";
import relayPoolService from "../../../services/relay-pool";
import clientRelaysService from "../../../services/client-relays";
import { RelayMode } from "../../../classes/relay";
import { RelayFavicon } from "../../../components/relay-favicon";
import UploadCloud01 from "../../../components/icons/upload-cloud-01";

export default function RelayControl({ url }: { url: string }) {
  const relay = useMemo(() => relayPoolService.requestRelay(url, false), [url]);
  const writeRelays = useObservable(clientRelaysService.writeRelays);

  const color = relay.connected ? "green" : "red";

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
