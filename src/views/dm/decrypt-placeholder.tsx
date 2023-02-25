import { Button } from "@chakra-ui/react";
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

  const decrypt = async () => {
    setLoading(true);
    const decrypted = await requestDecrypt(data, pubkey);
    if (decrypted) setDecrypted(decrypted);
    setLoading(false);
  };

  if (decrypted) {
    return children(decrypted);
  }
  return (
    <Button variant="text" onClick={decrypt} isLoading={loading} leftIcon={<UnlockIcon />} width="100%">
      Decrypt
    </Button>
  );
}
