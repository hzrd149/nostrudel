import React, { useState } from "react";
import { useAsync } from "react-use";
import dayjs from "dayjs";
import { requestProvider } from "webln";
import { Box, BoxProps, Button, ButtonGroup, Flex, IconButton, Text, useDisclosure } from "@chakra-ui/react";
import { parseBolt11 } from "applesauce-common/helpers";

import { CopyIconButton } from "../copy-icon-button";
import QrCode02 from "../icons/qr-code-02";
import QrCodeModal from "../qr-code/qr-code-modal";
import ValueDisplay from "../value-display";

export type InvoiceButtonProps = {
  paymentRequest: string;
};
export default function InlineInvoiceCard({
  paymentRequest,
  ...props
}: Omit<BoxProps, "children"> & InvoiceButtonProps) {
  const { value: invoice, error } = useAsync(async () => parseBolt11(paymentRequest));
  const qr = useDisclosure();

  const [loading, setLoading] = useState(false);
  const handleClick = async (event: React.SyntheticEvent) => {
    if (!window.webln) return;

    event.preventDefault();
    setLoading(true);
    try {
      const provider = await requestProvider();
      await provider.sendPayment(paymentRequest);
    } catch (e) {
      // Ignore failed payments, the user can retry or pay with another wallet via the lightning: link
    }
    setLoading(false);
  };

  if (error) return <>{paymentRequest}</>;

  if (!invoice) return <>Loading Invoice...</>;

  const isExpired = dayjs.unix(invoice.expiry).isBefore(dayjs());

  return (
    <Flex
      padding="3"
      borderColor="yellow.300"
      borderWidth="1px"
      rounded="md"
      direction="column"
      position="relative"
      {...props}
    >
      <Flex flexWrap="wrap" gap="4" alignItems="center">
        <Box flexGrow={1}>
          <Text fontWeight="bold">Lightning Invoice</Text>
          <Text>{invoice.description}</Text>
        </Box>
        <Box>
          <Text color={isExpired ? "red.400" : undefined}>
            {isExpired ? "Expired" : "Expires"}: {dayjs.unix(invoice.expiry).fromNow()}
          </Text>
        </Box>
        <ButtonGroup variant="outline">
          <CopyIconButton value={invoice.paymentRequest} aria-label="Copy Invoice" />
          <IconButton icon={<QrCode02 boxSize={6} />} onClick={qr.onOpen} aria-label="Show QrCode" />
          <Button as="a" onClick={handleClick} isLoading={loading} href={`lightning:${paymentRequest}`}>
            ⚡ Pay {invoice.amount ? <ValueDisplay sats={invoice.amount / 1000} /> : ""}
          </Button>
        </ButtonGroup>
      </Flex>

      {qr.isOpen && (
        <QrCodeModal
          isOpen={qr.isOpen}
          onClose={qr.onClose}
          title="Lightning Invoice"
          content={invoice.paymentRequest}
        />
      )}
    </Flex>
  );
}
