import { CloseIcon } from "@chakra-ui/icons";
import { Box, ButtonGroup, Flex, IconButton, Text } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { PropsWithChildren, ReactNode } from "react";

import useAsyncAction from "../../hooks/use-async-action";
import { cashuMintInfo } from "../../services/cashu-mints";
import CashuMintFavicon from "./cashu-mint-favicon";
import CashuMintName from "./cashu-mint-name";

/** A row for a cashu mint with a remove button, mirrors RelayControl */
export default function MintControl({
  url,
  onRemove,
  children,
  details,
}: PropsWithChildren<{
  url: string;
  onRemove: () => void | Promise<any>;
  details?: ReactNode;
}>) {
  const info = use$(cashuMintInfo(url));

  const remove = useAsyncAction(async () => {
    await onRemove();
  }, [onRemove]);

  return (
    <Flex gap="2" pl="2">
      <CashuMintFavicon mint={url} size="sm" mt="2" />
      <Box overflow="hidden">
        <CashuMintName mint={url} isTruncated />
        <Text fontSize="sm" color="gray.500" noOfLines={1}>
          {info?.description || url}
        </Text>
        {details}
      </Box>
      <ButtonGroup ms="auto" size="sm">
        {children}
        <IconButton
          aria-label="Remove Mint"
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
