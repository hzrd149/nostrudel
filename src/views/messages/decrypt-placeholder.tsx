import { Alert, AlertDescription, AlertIcon, Button } from "@chakra-ui/react";
import { useState } from "react";

import { UnlockIcon } from "../../components/icons";
import { useSigningContext } from "../../providers/signing-provider";

export default function DecryptPlaceholder({
  children,
  data,
  pubkey,
}: {
  children: (decrypted: string) => JSX.Element;
  data: string;
  pubkey: string;
}): JSX.Element {
  const { requestDecrypt } = useSigningContext();
  const [loading, setLoading] = useState(false);
  const [decrypted, setDecrypted] = useState<string>();
  const [error, setError] = useState<Error>();

  const decrypt = async () => {
    setLoading(true);
    try {
      const decrypted = await requestDecrypt(data, pubkey);
      if (decrypted) setDecrypted(decrypted);
    } catch (e) {
      if (e instanceof Error) setError(e);
    }
    setLoading(false);
  };

  if (decrypted) {
    return children(decrypted);
  }
  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }
  return (
    <Button onClick={decrypt} isLoading={loading} leftIcon={<UnlockIcon />} width="full">
      Decrypt
    </Button>
  );
}
