import { useCallback, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Link,
} from "@chakra-ui/react";
import { generateSecretKey, getPublicKey, nip19 } from "nostr-tools";
import { useNavigate } from "react-router-dom";
import { hexToBytes } from "@noble/hashes/utils";
import { useForm } from "react-hook-form";
import { decrypt } from "nostr-tools/nip49";
import { isHexKey } from "applesauce-core/helpers";

import { safeDecode } from "../../helpers/nip19";
import accountService from "../../services/account";
import NsecAccount from "../../classes/accounts/nsec-account";
import QRCodeScannerButton from "../../components/qr-code/qr-code-scanner-button";
import { Account } from "../../classes/accounts/account";
import PasswordAccount from "../../classes/accounts/password-account";
import Eye from "../../components/icons/eye";
import EyeOff from "../../components/icons/eye-off";

export default function LoginNsecView() {
  const navigate = useNavigate();

  const [show, setShow] = useState(false);

  const { register, handleSubmit, setValue } = useForm({ defaultValues: { value: "" }, mode: "all" });

  const generateNewKey = useCallback(() => {
    const key = generateSecretKey();
    setValue("value", nip19.nsecEncode(key));
    setShow(true);
  }, [setValue, setShow]);

  const submit = handleSubmit(async ({ value }) => {
    let account: Account;
    if (isHexKey(value)) {
      account = NsecAccount.fromKey(hexToBytes(value));
    } else if (value.startsWith("ncryptsec")) {
      const password = window.prompt("Decryption password");
      if (password === null) throw new Error("Password required");

      const key = decrypt(value, password);
      const passwordAccount = PasswordAccount.fromNcryptsec(getPublicKey(key), value);
      passwordAccount.signer.unlock(password);
      account = passwordAccount;
    } else if (value.startsWith("nsec")) {
      const decode = safeDecode(value);
      if (decode?.type !== "nsec") throw new Error();

      const key = decode.data;
      const password = window.prompt("Local encryption password. This password is used to keep your secret key safe");
      if (password) {
        const a = new PasswordAccount(getPublicKey(key));
        a.signer.key = key;
        a.signer.setPassword(password);
        account = a;
      } else {
        account = NsecAccount.fromKey(decode.data);
      }
    } else throw new Error("Invalid key");

    accountService.addAccount(account);
    accountService.switchAccount(account.pubkey);
  });

  return (
    <Flex as="form" direction="column" gap="4" onSubmit={submit} w="full">
      <Alert status="warning" maxWidth="30rem">
        <AlertIcon />
        <Box>
          <AlertTitle>Using secret keys is insecure</AlertTitle>
          <AlertDescription>
            You should use a browser extension like{" "}
            <Link isExternal href="https://getalby.com/" target="_blank">
              Alby
            </Link>
            {", "}
            <Link isExternal href="https://github.com/susumuota/nostr-keyx" target="_blank">
              nostr-keyx
            </Link>
            {" or "}
            <Link
              isExternal
              href="https://chrome.google.com/webstore/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp"
              target="_blank"
            >
              Nos2x
            </Link>
          </AlertDescription>
        </Box>
      </Alert>

      <FormControl>
        <FormLabel>Enter user secret key</FormLabel>
        <Flex gap="2">
          <InputGroup size="md">
            <Input
              type={show ? "text" : "password"}
              placeholder="hex, nsec or ncryptsec"
              {...register("value", { required: true })}
              isRequired
            />
            <InputRightElement>
              <IconButton
                h="1.75rem"
                size="sm"
                variant="ghost"
                onClick={() => setShow((v) => !v)}
                icon={show ? <EyeOff boxSize={5} /> : <Eye boxSize={5} />}
                aria-label="Reveal password"
              />
            </InputRightElement>
          </InputGroup>
          <QRCodeScannerButton onData={(v) => setValue("value", v)} />
        </Flex>
      </FormControl>

      <Flex justifyContent="space-between" gap="2">
        <Button variant="link" onClick={() => navigate("../")}>
          Back
        </Button>
        <Button ml="auto" onClick={generateNewKey}>
          Generate New
        </Button>
        <Button colorScheme="primary" type="submit">
          Login
        </Button>
      </Flex>
    </Flex>
  );
}
