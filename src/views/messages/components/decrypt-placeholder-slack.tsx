import { Alert, AlertDescription, AlertIcon, Button } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useEffect, useState } from "react";

import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import { UnlockIcon } from "../../../components/icons";
import { useLegacyMessagePlaintext } from "../../../hooks/use-legacy-message-plaintext";
import localSettings from "../../../services/local-settings";

export default function DecryptPlaceholderSlack({
  children,
  message,
}: {
  children: (decrypted: string) => JSX.Element;
  message: NostrEvent;
}): JSX.Element {
  const autoDecryptMessages = useObservableEagerState(localSettings.autoDecryptMessages);
  const [loading, setLoading] = useState(false);
  const { unlock, plaintext, error } = useLegacyMessagePlaintext(message);

  const decrypt = async () => {
    setLoading(true);
    try {
      await unlock();
    } catch (e) {}
    setLoading(false);
  };

  // auto decrypt
  useEffect(() => {
    if (autoDecryptMessages && !plaintext && !error) {
      setLoading(true);
      unlock()
        .catch(() => {})
        .finally(() => {
          setLoading(false);
        });
    }
  }, [autoDecryptMessages, error, plaintext]);

  if (plaintext) {
    return children(plaintext);
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md" maxW="lg">
        <AlertIcon />
        <AlertDescription flex="1">{error.message}</AlertDescription>
        <DebugEventButton event={message} size="sm" mr="2" />
        <Button isLoading={loading} leftIcon={<UnlockIcon />} onClick={decrypt} size="sm">
          Try again
        </Button>
      </Alert>
    );
  }

  return (
    <Button
      onClick={decrypt}
      isLoading={loading}
      leftIcon={<UnlockIcon />}
      size="sm"
      variant="ghost"
      border="1px dashed"
      w="full"
      maxW="lg"
    >
      Decrypt message
    </Button>
  );
}
