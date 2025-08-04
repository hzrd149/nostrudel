import { CloseIcon } from "@chakra-ui/icons";
import { Box, ButtonGroup, Flex, IconButton, Link, Text } from "@chakra-ui/react";
import { PropsWithChildren, ReactNode, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import RelayFavicon from "../../../components/relay/relay-favicon";
import { useRelayInfo } from "../../../hooks/use-relay-info";

export default function RelayControl({
  url,
  onRemove,
  children,
  details,
}: PropsWithChildren<{
  url: string;
  onRemove: () => void | Promise<any>;
  details?: ReactNode;
}>) {
  const { info } = useRelayInfo(url);
  const [loading, setLoading] = useState(false);

  const remove = async () => {
    setLoading(true);
    try {
      await onRemove();
    } catch (error) {}
    setLoading(false);
  };

  return (
    <Flex gap="2" pl="2">
      <RelayFavicon relay={url} size="sm" mt="2" />
      <Box overflow="hidden">
        <Link as={RouterLink} to={`/relays/${encodeURIComponent(url)}`} isTruncated>
          {url}
        </Link>
        <Text fontSize="sm" color="gray.500" noOfLines={1}>
          {info?.description}
        </Text>
        {details}
      </Box>
      <ButtonGroup ms="auto" size="sm">
        {children}
        <IconButton
          aria-label="Remove Relay"
          icon={<CloseIcon />}
          size="sm"
          colorScheme="red"
          variant="ghost"
          onClick={remove}
          isLoading={loading}
        />
      </ButtonGroup>
    </Flex>
  );
}
