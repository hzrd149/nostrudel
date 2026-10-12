import { Button, FormControl, Input, useToast, VStack } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useState } from "react";

import EncryptedStorage from "../../classes/encrypted-storage";
import useAsyncAction from "../../hooks/use-async-action";
import { decryptionCache$ } from "../../services/decryption-cache";

/**
 * Compact password form for the decryption cache's own lock (D-09). Reuses
 * `require-decryption-cache.tsx`'s exact validation and failure toasts — this is a security
 * requirement (ASVS V5), not a convenience, so no new validation logic is added here. This
 * component has no card, no page chrome, and no disable-cache/disable-encryption escape hatches;
 * those stay exclusively in `require-decryption-cache.tsx`.
 */
export default function CacheUnlockForm({ onUnlocked }: { onUnlocked?: () => void }) {
  const cache = use$(decryptionCache$);
  const [password, setPassword] = useState("");
  const toast = useToast();

  const unlock = useAsyncAction(async () => {
    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter your message cache password",
        status: "warning",
      });
      return;
    }

    if (cache instanceof EncryptedStorage) {
      const success = await cache.unlock(password);
      if (success) {
        setPassword("");
        onUnlocked?.();
      } else {
        toast({
          title: "Incorrect password",
          description: "The password you entered is incorrect",
          status: "error",
        });
      }
    }
  }, [password, cache, toast, onUnlocked]);

  return (
    <VStack spacing="2" align="stretch">
      <FormControl>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !unlock.loading && unlock.run()}
          placeholder="Message cache password"
          autoFocus
          autoComplete="off"
        />
      </FormControl>
      <Button colorScheme="primary" onClick={unlock.run} isLoading={unlock.loading} loadingText="Unlocking...">
        Unlock
      </Button>
    </VStack>
  );
}
