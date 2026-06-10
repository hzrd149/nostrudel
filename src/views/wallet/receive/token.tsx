import { Flex, Button, Text, Card, CardBody } from "@chakra-ui/react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { useActionRunner } from "applesauce-react/hooks";
import { getTokenMetadata } from "@cashu/cashu-ts";
import { ReceiveToken } from "applesauce-wallet/actions";

import SimpleView from "../../../components/layout/presets/simple-view";
import CashuMintFavicon from "../../../components/cashu/cashu-mint-favicon";
import CashuMintName from "../../../components/cashu/cashu-mint-name";
import useAsyncAction from "../../../hooks/use-async-action";
import couch from "../../../services/cashu-couch";
import { getCashuWallet } from "../../../services/cashu-mints";

export default function WalletReceiveTokenView() {
  const navigate = useNavigate();
  const actions = useActionRunner();
  const location = useLocation();

  const token: string = location.state?.token;
  if (!token) return <Navigate to="/wallet" />;

  const metadata = getTokenMetadata(token);
  const originalAmount = metadata.amount.toString();

  const receive = useAsyncAction(async () => {
    const wallet = await getCashuWallet(metadata.mint, metadata.unit);
    const decoded = wallet.decodeToken(token);
    // ReceiveToken action handles the swap at the mint internally
    await actions.run(ReceiveToken, decoded, { addHistory: true, couch });
    navigate("/wallet");
  }, [token, metadata.mint, metadata.unit, actions, navigate]);

  return (
    <SimpleView title="Receive Token" maxW="xl" center>
      <Card mb="4">
        <CardBody>
          <Text fontSize="4xl" textAlign="center">
            {originalAmount} {metadata.unit || "tokens"}
          </Text>
          <Flex alignItems="center" justifyContent="center" gap="2" mt="4">
            <CashuMintFavicon mint={metadata.mint} size="sm" />
            <CashuMintName mint={metadata.mint} fontSize="lg" />
          </Flex>
        </CardBody>
      </Card>

      <Button colorScheme="primary" isLoading={receive.loading} onClick={receive.run} size="lg">
        Receive
      </Button>
    </SimpleView>
  );
}
