import { useState } from "react";
import { useActionHub } from "applesauce-react/hooks";
import { Button, Flex, Textarea, useToast } from "@chakra-ui/react";
import { getDecodedToken, Token } from "@cashu/cashu-ts";
import { ReceiveToken } from "applesauce-wallet/actions";
import { useNavigate } from "react-router-dom";

import SimpleView from "../../components/layout/presets/simple-view";
import { getCashuWallet } from "../../services/cashu-mints";
import RouterLink from "../../components/router-link";

export default function WalletReceiveView() {
  const actions = useActionHub();
  const navigate = useNavigate();
  const toast = useToast();

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);
  const receive = async () => {
    setLoading(true);
    try {
      const decoded = getDecodedToken(input.trim());

      // swap tokens
      const wallet = await getCashuWallet(decoded.mint);
      const proofs = await wallet.receive(decoded);
      const token: Token = { mint: decoded.mint, proofs };

      // save new tokens
      await actions.run(ReceiveToken, token);

      const amount = token.proofs.reduce((t, p) => t + p.amount, 0);
      toast({ status: "success", description: `Received ${amount} sats` });

      navigate("/wallet");
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
      console.log(error);
    }
    setLoading(false);
  };

  return (
    <SimpleView title="Receive" maxW="2xl" center>
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="cashuB...." rows={10} />
      <Flex gap="2">
        <Button as={RouterLink} to="/wallet">
          Back
        </Button>
        <Button colorScheme="primary" onClick={receive} isLoading={loading} ms="auto">
          Receive
        </Button>
      </Flex>
    </SimpleView>
  );
}
