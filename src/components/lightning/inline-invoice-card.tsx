import React, { useState } from "react";
import { useAsync } from "react-use";
import dayjs from "dayjs";
import { requestProvider } from "webln";
import {
  Box,
  BoxProps,
  Button,
  ButtonGroup,
  CloseButton,
  Flex,
  IconButton,
  Input,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { parseBolt11 } from "applesauce-core/helpers";

import { humanReadableSats } from "../../helpers/lightning";
import { CopyIconButton } from "../copy-icon-button";
import QrCode02 from "../icons/qr-code-02";
import QrCodeSvg from "../qr-code/qr-code-svg";

export type InvoiceButtonProps = {
  paymentRequest: string;
};
export default function InlineInvoiceCard({
  paymentRequest,
  ...props
}: Omit<BoxProps, "children"> & InvoiceButtonProps) {
  const { value: invoice, error } = useAsync(async () => parseBolt11(paymentRequest));
  const more = useDisclosure();

  const [loading, setLoading] = useState(false);
  const handleClick = async (event: React.SyntheticEvent) => {
    if (!window.webln) return;

    event.preventDefault();
    setLoading(true);
    try {
      const provider = await requestProvider();
      const response = await provider.sendPayment(paymentRequest);
      if (response.preimage) {
        console.log("Paid");
      }
    } catch (e) {
      console.log("Failed to pay invoice");
      console.log(e);
    }
    setLoading(false);
  };

  if (error) {
    <>{paymentRequest}</>;
  }

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
      {more.isOpen ? (
        <>
          <Box maxW="3in" mx="auto" w="full">
            <QrCodeSvg content={invoice.paymentRequest} />
          </Box>
          <Flex gap="2" mt="2">
            <Input value={invoice.paymentRequest} userSelect="all" />
            <CopyIconButton value={invoice.paymentRequest} aria-label="Copy Invoice" />
          </Flex>
          <CloseButton onClick={more.onClose} position="absolute" right="2" top="2" />
        </>
      ) : (
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
            <IconButton icon={<QrCode02 boxSize={6} />} onClick={more.onToggle} aria-label="Show QrCode" />
            <Button as="a" onClick={handleClick} isLoading={loading} href={`lightning:${paymentRequest}`}>
              ⚡ Pay {invoice.amount ? humanReadableSats(invoice.amount / 1000) + " sats" : ""}
            </Button>
          </ButtonGroup>
        </Flex>
      )}
    </Flex>
  );
}
