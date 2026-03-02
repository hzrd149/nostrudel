import { Flex, Button, Text, Card, CardBody } from "@chakra-ui/react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { useActionRunner } from "applesauce-react/hooks";
import { getDecodedToken, type Token } from "@cashu/cashu-ts";
import { ReceiveToken } from "applesauce-wallet/actions";

import SimpleView from "../../../components/layout/presets/simple-view";
import CashuMintFavicon from "../../../components/cashu/cashu-mint-favicon";
import CashuMintName from "../../../components/cashu/cashu-mint-name";
import useAsyncAction from "../../../hooks/use-async-action";
import couch from "../../../services/cashu-couch";

export default function WalletReceiveTokenView() {
  const navigate = useNavigate();
  const actions = useActionRunner();
  const location = useLocation();

  const token: string = location.state?.token;
  if (!token) return <Navigate to="/wallet" />;

  const decoded: Token = getDecodedToken(token);
  const originalAmount = decoded.proofs.reduce((t, p) => t + p.amount, 0);

  const receive = useAsyncAction(async () => {
    // ReceiveToken action handles the swap at the mint internally
    await actions.run(ReceiveToken, decoded, { addHistory: true, couch });
    navigate("/wallet");
  }, [decoded, actions, navigate]);

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
