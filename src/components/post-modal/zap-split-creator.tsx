import {
  Flex,
  Heading,
  IconButton,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
  useToast,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { useForm } from "react-hook-form";

import { EventSplit } from "../../helpers/nostr/zaps";
import { AddIcon } from "../icons";
import { normalizeToHexPubkey } from "../../helpers/nip19";
import UserAvatar from "../user/user-avatar";
import UserLink from "../user/user-link";
import UserAutocomplete from "../user-autocomplete";

function getRemainingPercent(split: EventSplit) {
  return Math.round((1 - split.reduce((v, p) => v + p.percent, 0)) * 100) / 100;
}
export function fillRemainingPercent(split: EventSplit, pubkey: string) {
  const remainingPercent = getRemainingPercent(split);
  if (remainingPercent === 0) return split;
  return split.concat({ pubkey, percent: remainingPercent });
}

function validateNpub(input: string) {
  const pubkey = normalizeToHexPubkey(input);
  if (!pubkey) {
    return "Invalid npub";
  }
}

function AddUserForm({
  onSubmit,
  remainingPercent,
}: {
  onSubmit: (values: { pubkey: string; percent: number }) => void;
  remainingPercent: number;
}) {
  const toast = useToast();
  const { register, handleSubmit, getValues, setValue, reset, watch } = useForm({
    defaultValues: {
      pubkey: "",
      percent: Math.min(remainingPercent, 50),
    },
    mode: "all",
  });
  watch("percent");

  const submit = handleSubmit((values) => {
    try {
      const pubkey = normalizeToHexPubkey(values.pubkey);
      if (!pubkey) throw new Error("Invalid npub");
      const percent = values.percent / 100;
      onSubmit({ pubkey, percent });
      reset();
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  });

  return (
    <Flex as="form" gap="2" onSubmit={submit}>
      <UserAutocomplete {...register("pubkey", { required: true, validate: validateNpub })} />
      <NumberInput
        step={1}
        min={1}
        max={remainingPercent}
        value={getValues().percent || 0}
        onChange={(_, n) => setValue("percent", n, { shouldDirty: true })}
      >
        <NumberInputField size={8} />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
      <IconButton icon={<AddIcon />} aria-label="Add" type="submit" />
    </Flex>
  );
}

function UserCard({
  pubkey,
  percent,
  showRemove = true,
  onRemove,
}: {
  pubkey: string;
  percent: number;
  showRemove?: boolean;
  onRemove?: () => void;
}) {
  return (
    <Flex gap="2" overflow="hidden" alignItems="center">
      <UserAvatar pubkey={pubkey} size="sm" />
      <UserLink pubkey={pubkey} fontWeight="bold" isTruncated />
      <Text fontWeight="bold" fontSize="lg" ml="auto">
        {Math.round(percent * 10000) / 100}%
      </Text>
      {showRemove && (
        <IconButton
          variant="ghost"
          icon={<CloseIcon />}
          aria-label="Remove from split"
          title="Remove"
          onClick={onRemove}
        />
      )}
    </Flex>
  );
}

export default function ZapSplitCreator({
  split,
  onChange,
  authorPubkey,
}: {
  split: EventSplit;
  onChange: (split: EventSplit) => void;
  authorPubkey?: string;
}) {
  const remainingPercent = getRemainingPercent(split);

  const addUser = ({ pubkey, percent }: { pubkey: string; percent: number }) => {
    if (percent > remainingPercent) throw new Error("Not enough percent left");
    if (split.some((s) => s.pubkey === pubkey)) throw new Error("User already in split");
    onChange(split.concat({ pubkey, percent }));
  };
  const removeUser = (pubkey: string) => {
    onChange(split.filter((p) => p.pubkey !== pubkey));
  };

  const displaySplit = authorPubkey ? fillRemainingPercent(split, authorPubkey) : split;

  return (
    <Flex gap="2" direction="column">
      <Heading size="sm">Zap Splits</Heading>
      {remainingPercent > 0 && <AddUserForm onSubmit={addUser} remainingPercent={remainingPercent * 100} />}
      {displaySplit.map(({ pubkey, percent }) => (
        <UserCard
          key={pubkey}
          pubkey={pubkey}
          percent={percent}
          showRemove={pubkey !== authorPubkey}
          onRemove={() => removeUser(pubkey)}
        />
      ))}
    </Flex>
  );
}
