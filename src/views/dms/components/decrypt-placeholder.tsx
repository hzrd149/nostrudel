import { useState } from "react";
import { Alert, AlertDescription, AlertIcon, Button, ButtonProps } from "@chakra-ui/react";

import { UnlockIcon } from "../../../components/icons";
import { useDecryptionContainer } from "../../../providers/global/dycryption-provider";
import useCurrentAccount from "../../../hooks/use-current-account";
import { getDMRecipient, getDMSender } from "../../../helpers/nostr/dms";
import { NostrEvent } from "../../../types/nostr-event";
import DebugEventButton from "../../../components/debug-modal/debug-event-button";

export default function DecryptPlaceholder({
  children,
  message,
  ...props
}: {
  children: (decrypted: string) => JSX.Element;
  message: NostrEvent;
} & Omit<ButtonProps, "children">): JSX.Element {
  const account = useCurrentAccount();
  const isOwn = account?.pubkey === message.pubkey;
  const [loading, setLoading] = useState(false);
  const { requestDecrypt, plaintext, error } = useDecryptionContainer(
    isOwn ? getDMRecipient(message) : getDMSender(message),
    message.content,
  );

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
