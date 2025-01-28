import { Button, Flex, Heading, Link, useToast } from "@chakra-ui/react";
import { PasswordSigner, SerialPortSigner, SimpleSigner } from "applesauce-signers";
import { useState } from "react";

import useAsyncErrorHandler from "../../../../hooks/use-async-error-handler";
import useCurrentAccount from "../../../../hooks/use-current-account";
import SerialPortAccount from "../../../../classes/accounts/serial-port-account";
import accountService from "../../../../services/account";

export default function MigrateAccountToDevice() {
  if (!SerialPortSigner.SUPPORTED) return null;

  const toast = useToast();
  const current = useCurrentAccount();
  const [loading, setLoading] = useState(false);

  const migrate = useAsyncErrorHandler(async () => {
    try {
      setLoading(true);
      if (!current?.signer) throw new Error("Account missing signer");
      const device = new SerialPortSigner();

      if (current.signer instanceof SimpleSigner) {
        // send key to device
        await device.restore(current.signer.key);
      } else if (current.signer instanceof PasswordSigner) {
        // unlock the signer first
        if (!current.signer.unlocked) {
          const password = window.prompt("Decryption password");
          if (password === null) throw new Error("Password required");
          await current.signer.unlock(password);
        }

        await device.restore(current.signer.key!);
      } else throw new Error("Unsupported signer type");

      // replace existing account
      const deviceAccount = new SerialPortAccount(current.pubkey);
      accountService.replaceAccount(current.pubkey, deviceAccount);
      accountService.switchAccount(deviceAccount.pubkey);
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
