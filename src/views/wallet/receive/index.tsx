import { useState } from "react";
import { Button, Flex, IconButton, Spacer, Textarea, useToast } from "@chakra-ui/react";
import { getDecodedToken, getEncodedToken } from "@cashu/cashu-ts";
import { decodeTokenFromEmojiString } from "applesauce-wallet/helpers";
import { useLocation, useNavigate } from "react-router-dom";

import SimpleView from "../../../components/layout/presets/simple-view";
import RouterLink from "../../../components/router-link";
import QRCodeScannerButton from "../../../components/qr-code/qr-code-scanner-button";
import Clipboard from "../../../components/icons/clipboard";

export default function WalletReceiveView() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [input, setInput] = useState(location.state?.input ?? "");

  const handleScannerResult = (result: string) => {
    try {
      const token = getDecodedToken(result.trim());
      navigate("/wallet/receive/token", { state: { token: getEncodedToken(token) }, replace: true });
    } catch (error) {
      setInput(result);
    }
  };

  const receive = () => {
    try {
      const token = getDecodedToken(input.trim());
      navigate("/wallet/receive/token", { state: { token: getEncodedToken(token) }, replace: true });
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
  };

  return (
    <SimpleView title="Receive" maxW="2xl" center>
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onPaste={(e) => {
          try {
            const token = decodeTokenFromEmojiString(e.clipboardData.getData("text"));
            if (token) navigate("/wallet/receive/token", { state: { token: getEncodedToken(token) } });
          } catch (error) {}
        }}
        placeholder="cashuB...."
        rows={10}
      />
      <Flex gap="2">
        <Button as={RouterLink} to="/wallet">
          Back
        </Button>
        <Spacer />
        <IconButton
          icon={<Clipboard boxSize={5} />}
          aria-label="Paste"
          onClick={async () => handleScannerResult(await navigator.clipboard.readText())}
        />
        <QRCodeScannerButton onResult={handleScannerResult} />
        <Button colorScheme="primary" onClick={receive}>
          Receive
        </Button>
      </Flex>
    </SimpleView>
  );
}
