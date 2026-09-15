import { CloseIcon } from "@chakra-ui/icons";
import { Box, ButtonGroup, Flex, IconButton, Link, Text } from "@chakra-ui/react";
import { PropsWithChildren, ReactNode } from "react";

import RelayFavicon from "../../../../components/relay/relay-favicon";
import useAsyncAction from "../../../../hooks/use-async-action";
import { useRelayInfo } from "../../../../hooks/use-relay-info";
import RelayLink from "../../../../components/relay/relay-link";

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

  const remove = useAsyncAction(async () => {
    await onRemove();
  }, [onRemove]);

  return (
    <Flex gap="2" pl="2">
      <RelayFavicon relay={url} size="sm" mt="2" />
      <Box overflow="hidden">
        <RelayLink relay={url} isTruncated />
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
          onClick={remove.run}
          isLoading={remove.loading}
        />
      </ButtonGroup>
    </Flex>
  );
}
