import {
  Flex,
  Heading,
  IconButton,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  useToast,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { useForm } from "react-hook-form";

import { AddIcon } from "../../../components/icons";
import { normalizeToHexPubkey } from "../../../helpers/nip19";
import UserAvatar from "../../../components/user/user-avatar";
import UserLink from "../../../components/user/user-link";
import UserAutocomplete from "../../../components/user-autocomplete";

export type Split = { pubkey: string; weight: number };

function validateNpub(input: string) {
  const pubkey = normalizeToHexPubkey(input);
  if (!pubkey) {
    return "Invalid npub";
  }
}

function AddUserForm({ onSubmit }: { onSubmit: (values: Split) => void }) {
  const toast = useToast();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      pubkey: "",
    },
    mode: "all",
  });

  const submit = handleSubmit((values) => {
    try {
      const pubkey = normalizeToHexPubkey(values.pubkey);
      if (!pubkey) throw new Error("Invalid npub");
      onSubmit({ pubkey, weight: 1 });
      reset();
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  });

  return (
    <Flex gap="2">
      <UserAutocomplete
        placeholder="Search users"
        {...register("pubkey", { required: true, validate: validateNpub })}
      />
      <IconButton icon={<AddIcon boxSize={5} />} aria-label="Add" onClick={submit} />
    </Flex>
  );
}

function UserCard({
  pubkey,
  weight,
  onRemove,
  onChange,
}: {
  pubkey: string;
  weight: number;
  onRemove?: () => void;
  onChange?: (split: Split) => void;
}) {
  return (
    <Flex gap="2" overflow="hidden" alignItems="center">
      <UserAvatar pubkey={pubkey} size="sm" />
      <UserLink pubkey={pubkey} fontWeight="bold" isTruncated />

      <NumberInput
        step={1}
        min={1}
        value={weight}
        onChange={(_, n) => onChange?.({ pubkey, weight: Number.isFinite(n) ? n : 1 })}
        ml="auto"
      >
        <NumberInputField size={2} />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
      <IconButton
        variant="ghost"
        icon={<CloseIcon />}
        aria-label="Remove from split"
        title="Remove"
        onClick={onRemove}
      />
    </Flex>
  );
}

export default function ZapSplitCreator({
  splits,
  onChange,
}: {
  splits: Split[];
  onChange: (split: Split[]) => void;
  authorPubkey?: string;
}) {
  const addUser = ({ pubkey, weight }: Split) => {
    if (splits.some((s) => s.pubkey === pubkey)) throw new Error("User already in split");
    onChange(splits.concat({ pubkey, weight }));
  };
  const removeUser = (pubkey: string) => {
    onChange(splits.filter((p) => p.pubkey !== pubkey));
  };
  const changeUser = (split: Split) => {
    onChange(splits.map((s) => (s.pubkey === split.pubkey ? split : s)));
  };

  return (
    <Flex gap="2" direction="column">
      <Heading size="sm">Zap Splits</Heading>
      <AddUserForm onSubmit={addUser} />
      {splits.map(({ pubkey, weight }) => (
        <UserCard
          key={pubkey}
          pubkey={pubkey}
          weight={weight}
          onRemove={() => removeUser(pubkey)}
          onChange={changeUser}
        />
      ))}
    </Flex>
  );
}
