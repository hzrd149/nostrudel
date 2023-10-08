import React, { useState } from "react";
import { useAsync } from "react-use";
import dayjs from "dayjs";
import { requestProvider } from "webln";
import { Box, Button, ButtonGroup, IconButton, Text } from "@chakra-ui/react";

import { parsePaymentRequest, readablizeSats } from "../helpers/bolt11";
import { CopyToClipboardIcon } from "./icons";

export type InvoiceButtonProps = {
  paymentRequest: string;
};
export const InlineInvoiceCard = ({ paymentRequest }: InvoiceButtonProps) => {
  const { value: invoice, error } = useAsync(async () => parsePaymentRequest(paymentRequest));

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

  const isExpired = dayjs(invoice.expiry).isBefore(dayjs());

  return (
    <Box
      padding="3"
      borderColor="yellow.300"
      borderWidth="1px"
      borderRadius="md"
      display="flex"
      flexWrap="wrap"
      gap="4"
      alignItems="center"
    >
      <Box flexGrow={1}>
        <Text fontWeight="bold">Lightning Invoice</Text>
        <Text>{invoice.description}</Text>
      </Box>
      <Box>
        <Text color={isExpired ? "red.400" : undefined}>
          {isExpired ? "Expired" : "Expires"}: {dayjs(invoice.expiry).fromNow()}
        </Text>
      </Box>
      <ButtonGroup>
        <IconButton
          icon={<CopyToClipboardIcon />}
          title="Copy to clipboard"
          aria-label="copy invoice"
          variant="outline"
        />
        <Button as="a" variant="outline" onClick={handleClick} isLoading={loading} href={`lightning:${paymentRequest}`}>
          ⚡ Pay {invoice.amount ? readablizeSats(invoice.amount / 1000) + " sats" : ""}
        </Button>
      </ButtonGroup>
    </Box>
  );
};
