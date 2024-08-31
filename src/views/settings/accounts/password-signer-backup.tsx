import { useCallback, useState } from "react";
import {
  Button,
  ButtonGroup,
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

import SimpleSigner from "../../../classes/signers/simple-signer";
import useCurrentAccount from "../../../hooks/use-current-account";
import EyeOff from "../../../components/icons/eye-off";
import Eye from "../../../components/icons/eye";
import { CopyIconButton } from "../../../components/copy-icon-button";
import PasswordSigner from "../../../classes/signers/password-signer";
import { useForm } from "react-hook-form";

const fake = Array(48).fill("x");

export default function PasswordSignerBackup() {
  const toast = useToast();
  const account = useCurrentAccount()!;
  const signer = account.signer;
  if (!(signer instanceof PasswordSigner)) return null;

  const sensitive = useDisclosure();
  const { register, handleSubmit, formState, reset } = useForm({
    defaultValues: { current: "", new: "", repeat: "" },
    mode: "all",
  });

  const changePassword = handleSubmit(async (values) => {
    try {
      if (values.repeat !== values.new) throw new Error("New passwords do not match");

      try {
        if (!signer.unlocked) await signer.unlock(values.current);
        else await signer.testPassword(values.current);
      } catch (error) {
        throw new Error("Bad password");
      }

      await signer.setPassword(values.new);
      reset();
      toast({ description: "Changed password", status: "success" });
    } catch (error) {
      if (error instanceof Error) toast({ description: error.message, status: "error" });
    }
  });

  return (
    <>
      <FormControl>
        <FormLabel>Encrypted secret key</FormLabel>
        <Flex gap="2">
          <Input value={signer.ncryptsec} readOnly placeholder="Click to show nsec" userSelect="all" />
          <CopyIconButton value={signer.ncryptsec} aria-label="Copy nsec to clipboard" />
        </Flex>
      </FormControl>
      <Flex as="form" onSubmit={changePassword} direction="column" gap="2">
        <Heading size="md" mt="2">
          Change password
        </Heading>
        <Input
          maxW="sm"
          type={sensitive.isOpen ? "text" : "password"}
          placeholder="Current Password"
          autoComplete="off"
          {...register("current", { required: true })}
          isRequired
        />
        <FormControl>
          <FormLabel>New Password</FormLabel>
          <Flex direction="column" gap="2" maxW="sm">
            <Input
              placeholder="New Password"
              type={sensitive.isOpen ? "text" : "password"}
              autoComplete="off"
              {...register("new", { required: true })}
              isRequired
            />
            <Input
              placeholder="Repeat Password"
              type={sensitive.isOpen ? "text" : "password"}
              autoComplete="off"
              {...register("repeat", { required: true })}
              isRequired
            />
            {formState.isDirty && (
              <ButtonGroup size="sm" ml="auto">
                <IconButton
                  type="button"
                  aria-label="Show passwords"
                  icon={sensitive.isOpen ? <Eye boxSize={5} /> : <EyeOff boxSize={5} />}
                  onClick={sensitive.onToggle}
                />
                <Button type="submit">Change</Button>
              </ButtonGroup>
            )}
          </Flex>
        </FormControl>
      </Flex>
    </>
  );
}
