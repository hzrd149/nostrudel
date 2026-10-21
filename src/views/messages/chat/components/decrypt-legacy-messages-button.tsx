import { Button, ButtonProps } from "@chakra-ui/react";
import { isLegacyMessageUnlocked, unlockLegacyMessage } from "applesauce-common/helpers";
import { LegacyMessagesGroup } from "applesauce-common/models";
import { useActiveAccount, useEventModel } from "applesauce-react/hooks";
import { useMemo } from "react";

import { UnlockIcon } from "../../../../components/icons";
import useAsyncAction from "../../../../hooks/use-async-action";

/** Decrypts the locked NIP-04 messages in a conversation, hidden when there are none */
export default function DecryptLegacyMessagesButton({ other, ...props }: { other: string } & ButtonProps) {
  const account = useActiveAccount()!;
  const messages = useEventModel(LegacyMessagesGroup, [account.pubkey, other]);
  const locked = useMemo(() => messages?.filter((m) => isLegacyMessageUnlocked(m) === false) ?? [], [messages]);

  // Decrypt one at a time so the signer is not flooded with prompts
  const decryptAll = useAsyncAction(async () => {
    for (const message of locked) {
      if (!isLegacyMessageUnlocked(message)) await unlockLegacyMessage(message, account.pubkey, account);
    }
  }, [locked, account]);

  if (locked.length === 0) return null;

  return (
    <Button
      leftIcon={<UnlockIcon boxSize={5} />}
      onClick={decryptAll.run}
      isLoading={decryptAll.loading}
      loadingText="Decrypting..."
      {...props}
    >
      Decrypt all ({locked.length})
    </Button>
  );
}
