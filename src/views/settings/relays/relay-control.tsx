import { Link as RouterLink } from "react-router-dom";
import { CloseIcon } from "@chakra-ui/icons";

import { Flex, IconButton, Link } from "@chakra-ui/react";
import RelayFavicon from "../../../components/relay-favicon";
import UploadCloud01 from "../../../components/icons/upload-cloud-01";
import { useWriteRelays } from "../../../hooks/use-client-relays";
import localSettings from "../../../services/local-settings";
import { RelayMode, removeAppRelay } from "../../../services/app-relays";

export default function RelayControl({ url }: { url: string }) {
  const writeRelays = useWriteRelays();

  const toggleWrite = () => {
    if (writeRelays.includes(url))
      localSettings.writeRelays.next(localSettings.writeRelays.value.filter((r) => r !== url));
    else localSettings.writeRelays.next([...localSettings.writeRelays.value, url]);
  };

  return (
    <Flex gap="2" alignItems="center" pl="2">
      <RelayFavicon relay={url} size="sm" />
      <Link as={RouterLink} to={`/relays/${encodeURIComponent(url)}`} isTruncated>
        {url}
      </Link>
      <IconButton
        ml="auto"
        aria-label="Toggle Write"
        icon={<UploadCloud01 />}
        size="sm"
        variant={writeRelays.includes(url) ? "solid" : "ghost"}
        colorScheme={writeRelays.includes(url) ? "green" : "gray"}
        onClick={toggleWrite}
        title="Toggle Write"
      />
      <IconButton
        aria-label="Remove Relay"
        icon={<CloseIcon />}
        size="sm"
        colorScheme="red"
        onClick={() => removeAppRelay(url, RelayMode.BOTH)}
      />
    </Flex>
  );
}
