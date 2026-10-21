import { Alert, AlertIcon, Button, Flex, Text } from "@chakra-ui/react";

import { UnlockIcon } from "../../../components/icons";
import useGiftWrapDecryption from "../../../hooks/use-gift-wrap-decryption";

export default function PendingLockedAlert() {
  const { locked, running, decrypted, start, stop } = useGiftWrapDecryption();

  if (!locked || locked.length === 0) return null;

  return (
    <Alert status="warning" variant="subtle" flexShrink={0}>
      <AlertIcon />
      <Flex align="center" justify="space-between" width="100%">
        <Text>
          {running
            ? `Decrypting… ${decrypted} done, ${locked.length} left`
            : `${locked.length} message${locked.length !== 1 ? "s" : ""} pending decryption.`}
        </Text>
        {running ? (
          <Button onClick={stop} variant="ghost">
            Stop
          </Button>
        ) : (
          <Button leftIcon={<UnlockIcon boxSize={5} />} onClick={start} colorScheme="orange" variant="solid">
            Decrypt All
          </Button>
        )}
      </Flex>
    </Alert>
  );
}
