import {
  Alert,
  AlertIcon,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Switch,
  Text,
  useToast,
} from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useState } from "react";
import { firstValueFrom } from "rxjs";

import EncryptedStorage from "../../../classes/encrypted-storage";
import useAsyncAction from "../../../hooks/use-async-action";
import { useNutWalletUnlocked } from "../../../hooks/use-wallets";
import { decryptionCache$, decryptionCacheStats$ } from "../../../services/decryption-cache";
import localSettings from "../../../services/preferences";
import { setNutWalletAutoUnlock, unlockNutWallet } from "../../../services/wallets";

/**
 * Step 1: unlock (or disable) the encrypted decryption cache, mirroring the direct message flow. Decrypted
 * wallet content is cached here, so unlocking it first means the wallet only has to be decrypted once.
 */
function CacheStep() {
  const stats = use$(decryptionCacheStats$);
  const [password, setPassword] = useState("");
  const toast = useToast();

  const unlock = useAsyncAction(async () => {
    const cache = await firstValueFrom(decryptionCache$);
    if (!(cache instanceof EncryptedStorage)) return;
    if (!password.trim()) throw new Error("Please enter your message cache password");

    const success = await cache.unlock(password);
    if (!success) throw new Error("The password you entered is incorrect");
    setPassword("");
  }, [password]);

  const disableCache = useAsyncAction(async () => {
    const cache = await firstValueFrom(decryptionCache$);
    if (cache) await cache.clear();
    localSettings.enableDecryptionCache.next(false);
    toast({ description: "Message cache disabled", status: "info" });
  }, [toast]);

  return (
    <Flex direction="column" gap="4">
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Text fontSize="sm">
          Decrypted wallet content is stored in your encrypted message cache. Unlock it first so your wallet only has to
          be decrypted once.
        </Text>
      </Alert>

      <FormControl>
        <FormLabel>Message cache password</FormLabel>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !unlock.loading && unlock.run()}
          placeholder="Enter your password"
          autoFocus
          autoComplete="off"
        />
        {stats && (
          <FormHelperText>
            Cache contains {stats.totalEntries} encrypted entries
            {stats.estimatedSize > 0 && ` (~${Math.round(stats.estimatedSize / 1024)}KB)`}
          </FormHelperText>
        )}
      </FormControl>

      <Flex gap="2">
        <Button colorScheme="primary" onClick={unlock.run} isLoading={unlock.loading} loadingText="Unlocking…" flex="1">
          Unlock cache
        </Button>
        <Button variant="ghost" colorScheme="orange" onClick={disableCache.run} isLoading={disableCache.loading}>
          Disable cache
        </Button>
      </Flex>
    </Flex>
  );
}

/** Step 2: decrypt the wallet now, and optionally keep it unlocked automatically in the future. */
function UnlockStep({ onClose }: { onClose: () => void }) {
  const autoUnlock = use$(localSettings.autoUnlockNutWallet) ?? false;
  const toast = useToast();

  const unlock = useAsyncAction(async () => {
    await unlockNutWallet();
    toast({ description: "Cashu wallet unlocked", status: "success" });
    onClose();
  }, [onClose]);

  return (
    <Flex direction="column" gap="4">
      <Text fontSize="sm" color="GrayText">
        Decrypting your Cashu wallet reads its balance, tokens and history. This asks your signer to decrypt each part,
        so it may prompt you a few times.
      </Text>

      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="autoUnlockNutWallet" mb="0">
            Automatically unlock in the future
          </FormLabel>
          <Switch
            id="autoUnlockNutWallet"
            isChecked={autoUnlock}
            onChange={(e) => setNutWalletAutoUnlock(e.target.checked)}
          />
        </Flex>
        <FormHelperText>
          Decrypt the wallet automatically each time it loads. Leave off to decrypt manually when you need it.
        </FormHelperText>
      </FormControl>

      <Button colorScheme="primary" onClick={unlock.run} isLoading={unlock.loading} loadingText="Unlocking…">
        Unlock wallet
      </Button>
    </Flex>
  );
}

export default function UnlockNutWalletModal({ onClose, ...props }: Omit<ModalProps, "children">) {
  const cache = use$(decryptionCache$);
  const unlocked = useNutWalletUnlocked();

  // The cache step is only required while an encrypted cache is still locked
  const cacheLocked = cache instanceof EncryptedStorage && !cache.unlocked;

  return (
    <Modal onClose={onClose} size="lg" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Unlock Cashu wallet</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {unlocked ? (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              Your Cashu wallet is unlocked.
            </Alert>
          ) : cacheLocked ? (
            <CacheStep />
          ) : (
            <UnlockStep onClose={onClose} />
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} variant="ghost">
            {unlocked ? "Done" : "Cancel"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
