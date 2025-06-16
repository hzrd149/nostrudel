import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, CardProps, Flex, Text } from "@chakra-ui/react";
import { useEventModel } from "applesauce-react/hooks";
import { WalletBalanceModel } from "applesauce-wallet/models";
import { WALLET_KIND } from "applesauce-wallet/helpers";

import { ECashIcon } from "../../../components/icons";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import useEventUpdate from "../../../hooks/use-event-update";
import RouterLink from "../../../components/router-link";
import AnimatedQRCodeScannerButton from "../../../components/qr-code/animated-qr-scanner-button";

export default function WalletBalanceCard({ pubkey, ...props }: { pubkey: string } & Omit<CardProps, "children">) {
  const navigate = useNavigate();
  const wallet = useReplaceableEvent({ kind: WALLET_KIND, pubkey });
  useEventUpdate(wallet?.id);

  const balance = useEventModel(WalletBalanceModel, [pubkey]);

  const handleScan = useCallback(
    (data: string) => {
      if (data.startsWith("cashuA") || data.startsWith("cashuB"))
        navigate("/wallet/receive", { state: { input: data } });
    },
    [navigate],
  );

  return (
    <Card {...props}>
      <CardHeader gap="4" display="flex" justifyContent="center" alignItems="center" pt="10">
        <ECashIcon color="green.400" boxSize={12} />
        <Text fontWeight="bold" fontSize="4xl">
          {balance ? Object.values(balance).reduce((t, v) => t + v, 0) : "--Locked--"}
        </Text>
      </CardHeader>
      <CardBody>
        <Flex gap="2" w="full">
          <Button as={RouterLink} w="full" size="lg" to="/wallet/send">
            Send
          </Button>
          <AnimatedQRCodeScannerButton onResult={handleScan} size="lg" />
          <Button as={RouterLink} w="full" size="lg" to="/wallet/receive">
            Receive
          </Button>
        </Flex>
      </CardBody>
    </Card>
  );
}
