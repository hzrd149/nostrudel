import { CloseIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";

import { ButtonGroup, Flex, IconButton, Link } from "@chakra-ui/react";
import { PropsWithChildren } from "react";
import RelayFavicon from "../../../components/relay-favicon";

export default function RelayControl({
  url,
  onRemove,
  children,
}: PropsWithChildren<{
  url: string;
  onRemove: () => void;
}>) {
  return (
    <Flex gap="2" alignItems="center" pl="2">
      <RelayFavicon relay={url} size="sm" />
      <Link as={RouterLink} to={`/relays/${encodeURIComponent(url)}`} isTruncated>
        {url}
      </Link>
      <ButtonGroup ms="auto" size="sm">
        {children}
        <IconButton aria-label="Remove Relay" icon={<CloseIcon />} size="sm" colorScheme="red" onClick={onRemove} />
      </ButtonGroup>
    </Flex>
  );
}
