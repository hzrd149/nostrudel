import { Button } from "@chakra-ui/react";
import { useState } from "react";
import { useUserMetadata } from "../hooks/use-user-metadata";
import {} from "nostr-tools/nip57";

const ZapButton = ({ pubkey, noteId }: { noteId: string; pubkey: string }) => {
  const [loading, setLoading] = useState(false);
  const metadata = useUserMetadata(pubkey);

  const handleClick = async () => {
    setLoading(true);
    try {
    } catch (e) {}
    setLoading(false);
  };

  return (
    <Button size="sm" onClick={handleClick} isLoading={loading}>
      Zap
    </Button>
  );
};

export default ZapButton;
