import { Alert, AlertIcon, Button, Flex, Text } from "@chakra-ui/react";
import { isGiftWrapLocked, unlockGiftWrap } from "applesauce-core/helpers/gift-wraps";
import { GiftWrapsModel } from "applesauce-core/models";
import { useActiveAccount, useEventModel } from "applesauce-react/hooks";

import { UnlockIcon } from "../../../components/icons";
import useAsyncAction from "../../../hooks/use-async-action";

export default function PendingLockedAlert() {
  const account = useActiveAccount()!;
  const locked = useEventModel(GiftWrapsModel, account ? [account.pubkey, true] : undefined);

  const decryptAll = useAsyncAction(async () => {
    if (!account || !locked) return;

    for (const giftWrap of locked) {
      if (!isGiftWrapLocked(giftWrap)) continue;

      try {
        await unlockGiftWrap(giftWrap, account);
      } catch (error) {
        if (error instanceof Error && error.message.toLocaleLowerCase().includes("user")) break;

        console.error("Failed to decrypt gift wrap:", giftWrap.id, error);
      }
    }
  }, [locked, account]);

  if (!locked || locked.length === 0) return null;

  return (
    <Alert status="warning" variant="subtle" flexShrink={0}>
      <AlertIcon />
      <Flex align="center" justify="space-between" width="100%">
        <Text>
          {locked.length} message{locked.length !== 1 ? "s" : ""} pending decryption.
        </Text>
        <Button
          size="sm"
          leftIcon={<UnlockIcon boxSize={4} />}
          onClick={decryptAll.run}
          isLoading={decryptAll.loading}
          colorScheme="orange"
          variant="solid"
          loadingText="Decrypting..."
        >
          Decrypt All
        </Button>
      </Flex>
    </Alert>
  );
}
