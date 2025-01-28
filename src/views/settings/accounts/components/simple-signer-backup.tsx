import { useCallback, useState } from "react";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { nip19 } from "nostr-tools";
import { encrypt } from "nostr-tools/nip49";
import { useForm } from "react-hook-form";
import { SimpleSigner } from "applesauce-signers";
import { PasswordAccount } from "applesauce-accounts/accounts";

import { useAccountManager, useActiveAccount } from "applesauce-react/hooks";
import EyeOff from "../../../../components/icons/eye-off";
import Eye from "../../../../components/icons/eye";
import { CopyIconButton } from "../../../../components/copy-icon-button";

const fake = Array(48).fill("x");

export default function SimpleSignerBackup() {
  const toast = useToast();
  const account = useActiveAccount()!;
  const signer = account.signer;
  if (!(signer instanceof SimpleSigner)) return null;

  const [backup, setBackup] = useState("");
  const sensitive = useDisclosure();
  const manager = useAccountManager();

  const showSecret = useCallback(async () => {
    const password = prompt("Its dangerous to export secret keys unprotected! do you want to add a password?");
    if (password) {
      setBackup(encrypt(signer.key, password));
    } else {
      setBackup(nip19.nsecEncode(signer.key));
    }
  }, [setBackup, signer]);

  const { register, handleSubmit, reset } = useForm({ defaultValues: { password: "" }, mode: "all" });

  const setPassword = handleSubmit(async (values) => {
    try {
      if (!values.password) throw new Error("Missing password");

      const newAccount = PasswordAccount.fromNcryptsec(account.pubkey, encrypt(signer.key, values.password));
      newAccount.pubkey = account.pubkey;
      await newAccount.signer.unlock(values.password);
      manager.replaceAccount(account, newAccount);
      reset();
    } catch (error) {
      if (error instanceof Error) toast({ description: error.message, status: "error" });
    }
  });

  return (
    <>
      <FormControl>
        <FormLabel>Secret key</FormLabel>
        <Flex gap="2">
          {!backup && (
            <IconButton
              aria-label="Show sensitive data"
              icon={backup ? <Eye boxSize={5} /> : <EyeOff boxSize={5} />}
              onClick={showSecret}
            />
          )}
          <Input
            value={backup ? backup : fake}
            type={backup ? "text" : "password"}
            readOnly
            placeholder="Click to show nsec"
            userSelect="all"
          />
          {backup && <CopyIconButton value={backup} aria-label="Copy nsec to clipboard" />}
        </Flex>
      </FormControl>
      <Flex as="form" onSubmit={setPassword} direction="column" gap="2">
        <Heading size="md" mt="2">
          Add password
        </Heading>
        <Flex gap="2" maxW="lg">
          <Input
            type={sensitive.isOpen ? "text" : "password"}
            placeholder="Current Password"
            autoComplete="off"
            {...register("password", { required: true })}
            isRequired
          />
          <IconButton
            type="button"
            aria-label="Show passwords"
            icon={sensitive.isOpen ? <Eye boxSize={5} /> : <EyeOff boxSize={5} />}
            onClick={sensitive.onToggle}
          />
          <Button type="submit">Set</Button>
        </Flex>
      </Flex>
    </>
  );
}
