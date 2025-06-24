import { Alert, AlertDescription, AlertIcon, Button, ButtonProps } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useEffect, useState } from "react";

import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import { UnlockIcon } from "../../../components/icons";
import { useLegacyMessagePlaintext } from "../../../hooks/use-legacy-message-plaintext";
import localSettings from "../../../services/local-settings";

export default function DecryptPlaceholder({
  children,
  message,
  ...props
}: {
  children: (decrypted: string) => JSX.Element;
  message: NostrEvent;
} & Omit<ButtonProps, "children">): JSX.Element {
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
      <Alert status="error">
        <AlertIcon />
        <AlertDescription>{error.message}</AlertDescription>
        <DebugEventButton event={message} size="sm" ml="auto" mr="2" />
        <Button isLoading={loading} leftIcon={<UnlockIcon />} onClick={decrypt} size="sm">
          Try again
        </Button>
      </Alert>
    );
  }
  return (
    <Button onClick={decrypt} isLoading={loading} leftIcon={<UnlockIcon />} width="full" {...props}>
      Decrypt
    </Button>
  );
}
