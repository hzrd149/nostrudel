import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertIcon, Button, ButtonProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { UnlockIcon } from "../../../components/icons";
import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import useAppSettings from "../../../hooks/use-user-app-settings";
import { useKind4Decrypt } from "../../../hooks/use-kind4-decryption";

export default function DecryptPlaceholder({
  children,
  message,
  ...props
}: {
  children: (decrypted: string) => JSX.Element;
  message: NostrEvent;
} & Omit<ButtonProps, "children">): JSX.Element {
  const { autoDecryptDMs } = useAppSettings();
  const [loading, setLoading] = useState(false);
  const { requestDecrypt, plaintext, error } = useKind4Decrypt(message);

  const decrypt = async () => {
    setLoading(true);
    try {
      await requestDecrypt();
    } catch (e) {}
    setLoading(false);
  };

  // auto decrypt
  useEffect(() => {
    if (autoDecryptDMs && !plaintext && !error) {
      setLoading(true);
      requestDecrypt()
        .catch(() => {})
        .finally(() => {
          setLoading(false);
        });
    }
  }, [autoDecryptDMs, error, plaintext]);

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
