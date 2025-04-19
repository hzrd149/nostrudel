import { Button, Flex, Spacer, Text, useToast } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { MouseEventHandler, useState } from "react";

import { LightningIcon } from "../../../../components/icons";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserLink from "../../../../components/user/user-link";
import { humanReadableSats } from "../../../../helpers/lightning";

export default function TextToSpeechStatus({ status }: { status: NostrEvent }) {
  const toast = useToast();

  const amountTag = status.tags.find((t) => t[0] === "amount" && t[1] && t[2]);
  const amountMsat = amountTag?.[1] && parseInt(amountTag[1]);
  const invoice = amountTag?.[2];

  const [paid, setPaid] = useState(false);
  const [paying, setPaying] = useState(false);
  const payInvoice: MouseEventHandler = async (e) => {
    try {
      if (window.webln && invoice) {
        setPaying(true);
        e.stopPropagation();
        await window.webln.sendPayment(invoice);
        setPaid(true);
      }
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
    setPaying(false);
  };

  return (
    <>
      <Flex gap="2" alignItems="center" grow={1}>
        <UserAvatarLink pubkey={status.pubkey} size="sm" />
        <UserLink pubkey={status.pubkey} fontWeight="bold" />
        <Text>Offered</Text>
        <Spacer />

        {invoice && amountMsat && (
          <Button
            colorScheme="yellow"
            size="sm"
            variant="solid"
            leftIcon={<LightningIcon />}
            onClick={payInvoice}
            isLoading={paying || paid}
            isDisabled={!window.webln}
          >
            Pay {humanReadableSats(amountMsat / 1000)} sats
          </Button>
        )}
      </Flex>
      <Text>{status.content}</Text>
    </>
  );
}
