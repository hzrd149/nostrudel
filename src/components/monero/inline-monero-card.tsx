import { Box, BoxProps, Button, ButtonGroup, Flex, IconButton, Text, useDisclosure } from "@chakra-ui/react";

import { CopyIconButton } from "../copy-icon-button";
import { ExternalLinkIcon, MoneroIcon } from "../icons";
import QrCode02 from "../icons/qr-code-02";
import QrCodeModal from "../qr-code/qr-code-modal";

export type InlineMoneroCardProps = {
  address: string;
};
export default function InlineMoneroCard({ address, ...props }: Omit<BoxProps, "children"> & InlineMoneroCardProps) {
  const qr = useDisclosure();
  const uri = `monero:${address}`;
  const short = `${address.slice(0, 12)}…${address.slice(-12)}`;

  return (
    <Flex
      padding="3"
      borderColor="orange.400"
      borderWidth="1px"
      rounded="md"
      direction="column"
      position="relative"
      {...props}
    >
      <Flex flexWrap="wrap" gap="4" alignItems="center">
        <Flex gap="2" alignItems="center" flexGrow={1} minW="0">
          <MoneroIcon boxSize={6} color="orange.400" flexShrink={0} />
          <Box minW="0">
            <Text fontWeight="bold">Monero Address</Text>
            <Text fontFamily="mono" isTruncated>
              {short}
            </Text>
          </Box>
        </Flex>
        <ButtonGroup variant="outline">
          <CopyIconButton value={address} aria-label="Copy Address" />
          <IconButton icon={<QrCode02 boxSize={6} />} onClick={qr.onOpen} aria-label="Show QrCode" />
          <Button as="a" href={uri} leftIcon={<ExternalLinkIcon />}>
            Open in Wallet
          </Button>
        </ButtonGroup>
      </Flex>

      {qr.isOpen && (
        <QrCodeModal
          isOpen={qr.isOpen}
          onClose={qr.onClose}
          title="Monero Address"
          content={uri}
          value={address}
        />
      )}
    </Flex>
  );
}
