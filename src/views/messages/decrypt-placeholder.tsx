import { useState } from "react";
import { Alert, AlertDescription, AlertIcon, Button } from "@chakra-ui/react";

import { UnlockIcon } from "../../components/icons";
import { useDecryptionContainer } from "../../providers/dycryption-provider";

export default function DecryptPlaceholder({
  children,
  data,
  pubkey,
}: {
  children: (decrypted: string) => JSX.Element;
  data: string;
  pubkey: string;
}): JSX.Element {
  const [loading, setLoading] = useState(false);
  const { requestDecrypt, plaintext, error } = useDecryptionContainer(pubkey, data);

  const decrypt = async () => {
    setLoading(true);
    try {
      await requestDecrypt();
    } catch (e) {}
    setLoading(false);
  };

  if (plaintext) {
    return children(plaintext);
  }
  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertDescription>{error.message}</AlertDescription>
        <Button isLoading={loading} leftIcon={<UnlockIcon />} onClick={decrypt} size="sm" ml="auto">
          Try again
        </Button>
      </Alert>
    );
  }
  return (
    <Button onClick={decrypt} isLoading={loading} leftIcon={<UnlockIcon />} width="full">
      Decrypt
    </Button>
  );
}
