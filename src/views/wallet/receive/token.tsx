import { Flex, Button, Text, Card, CardBody, useToast } from "@chakra-ui/react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { useActionHub } from "applesauce-react/hooks";
import { getDecodedToken, Token } from "@cashu/cashu-ts";
import { ReceiveToken } from "applesauce-wallet/actions";

import SimpleView from "../../../components/layout/presets/simple-view";
import CashuMintFavicon from "../../../components/cashu/cashu-mint-favicon";
import CashuMintName from "../../../components/cashu/cashu-mint-name";
import useAsyncAction from "../../../hooks/use-async-action";
import { getCashuWallet } from "../../../services/cashu-mints";

export default function WalletReceiveTokenView() {
  const navigate = useNavigate();
  const toast = useToast();
  const actions = useActionHub();
  const location = useLocation();

  const token: string = location.state?.token;
  if (!token) return <Navigate to="/wallet" />;

  const decoded = getDecodedToken(token);
  const originalAmount = decoded.proofs.reduce((t, p) => t + p.amount, 0);

  const receive = useAsyncAction(async () => {
    try {
      // swap tokens
      const wallet = await getCashuWallet(decoded.mint);
      const proofs = await wallet.receive(decoded);
      const token: Token = { mint: decoded.mint, proofs };

      const amount = token.proofs.reduce((t, p) => t + p.amount, 0);
      const fee = originalAmount - amount;

      // save new tokens
      await actions.run(ReceiveToken, token, undefined, fee || undefined);

      toast({ status: "success", description: `Received ${amount} sats` });

      navigate("/wallet");
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
      console.log(error);
    }
  }, [decoded, originalAmount, actions, navigate, toast]);

  // const swap = useAsyncAction(async () => {}, [decoded, originalAmount, actions, navigate, toast]);

  return (
    <SimpleView title="Receive Token" maxW="xl" center>
      <Card mb="4">
        <CardBody>
          <Text fontSize="4xl" textAlign="center">
            {originalAmount} sats
          </Text>
          <Flex alignItems="center" justifyContent="center" gap="2" mt="4">
            <CashuMintFavicon mint={decoded.mint} size="sm" />
            <CashuMintName mint={decoded.mint} fontSize="lg" />
          </Flex>
        </CardBody>
      </Card>

      <Button colorScheme="primary" isLoading={receive.loading} onClick={receive.run} size="lg">
        Receive
      </Button>
    </SimpleView>
  );
}
