import { Button, Flex, Heading, Link, useToast } from "@chakra-ui/react";
import { SerialPortAccount } from "applesauce-accounts/accounts";
import { useAccountManager, useActiveAccount } from "applesauce-react/hooks";
import { PasswordSigner, SerialPortSigner, SimpleSigner } from "applesauce-signers";
import { useState } from "react";

import useAsyncAction from "../../../../hooks/use-async-action";

export default function MigrateAccountToDevice() {
  if (!SerialPortSigner.SUPPORTED) return null;

  const toast = useToast();
  const current = useActiveAccount();
  const [loading, setLoading] = useState(false);
  const manager = useAccountManager();

  const { run: migrate } = useAsyncAction(async () => {
    try {
      setLoading(true);
      if (!current?.signer) throw new Error("Account missing signer");
      const signer = new SerialPortSigner();

      if (current.signer instanceof SimpleSigner) {
        // send key to device
        await signer.restore(current.signer.key);
      } else if (current.signer instanceof PasswordSigner) {
        // unlock the signer first
        if (!current.signer.unlocked) {
          const password = window.prompt("Decryption password");
          if (password === null) throw new Error("Password required");
          await current.signer.unlock(password);
        }

        await signer.restore(current.signer.key!);
      } else throw new Error("Unsupported signer type");

      // replace existing account
      const deviceAccount = new SerialPortAccount(current.pubkey, signer);
      manager.replaceAccount(current.pubkey, deviceAccount);
      manager.setActive(deviceAccount);
    } catch (error) {
      if (error instanceof Error) toast({ description: error.message, status: "error" });
    }
    setLoading(false);
  }, [setLoading, current]);

  return (
    <Flex direction="column" gap="2">
      <Heading size="md" mt="2">
        Migrate to{" "}
        <Link isExternal href="https://github.com/lnbits/nostr-signing-device" color="blue.500">
          nostr-signing-device
        </Link>
      </Heading>
      <Flex gap="2" maxW="lg">
        <Button colorScheme="purple" isLoading={loading} onClick={migrate}>
          Start migration
        </Button>
      </Flex>
    </Flex>
  );
}
