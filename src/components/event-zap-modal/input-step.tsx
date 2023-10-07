import { Box, Button, Flex, Input, Text } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import { NostrEvent } from "../../types/nostr-event";
import { readablizeSats } from "../../helpers/bolt11";
import { LightningIcon } from "../icons";
import useUserLNURLMetadata from "../../hooks/use-user-lnurl-metadata";
import { getZapSplits } from "../../helpers/nostr/zaps";
import { EmbedEvent, EmbedProps } from "../embed-event";
import useAppSettings from "../../hooks/use-app-settings";
import CustomZapAmountOptions from "./zap-options";
import { UserAvatar } from "../user-avatar";
import { UserLink } from "../user-link";

function UserCard({ pubkey, percent }: { pubkey: string; percent?: number }) {
  const { address } = useUserLNURLMetadata(pubkey);

  return (
    <Flex gap="2" alignItems="center" overflow="hidden">
      <UserAvatar pubkey={pubkey} size="md" />
      <Box overflow="hidden">
        <UserLink pubkey={pubkey} fontWeight="bold" />
        <Text isTruncated>{address}</Text>
      </Box>
      {percent && (
        <Text fontWeight="bold" fontSize="lg" ml="auto">
          {Math.round(percent * 10000) / 100}%
        </Text>
      )}
    </Flex>
  );
}

export type InputStepProps = {
  pubkey: string;
  event?: NostrEvent;
  initialComment?: string;
  initialAmount?: number;
  allowComment?: boolean;
  showEmbed?: boolean;
  embedProps?: EmbedProps;
  onSubmit: (values: { amount: number; comment: string }) => void;
};

export default function InputStep({
  event,
  pubkey,
  initialComment,
  initialAmount,
  allowComment = true,
  showEmbed = true,
  embedProps,
  onSubmit,
}: InputStepProps) {
  const { customZapAmounts } = useAppSettings();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<{
    amount: number;
    comment: string;
  }>({
    mode: "onBlur",
    defaultValues: {
      amount: initialAmount ?? (parseInt(customZapAmounts.split(",")[0]) || 100),
      comment: initialComment ?? "",
    },
  });

  const splits = event ? getZapSplits(event, pubkey) : [];

  const { metadata: lnurlMetadata } = useUserLNURLMetadata(pubkey);
  const canZap = lnurlMetadata?.allowsNostr && lnurlMetadata?.nostrPubkey;

  const showComment = allowComment && (splits.length > 0 || canZap || lnurlMetadata?.commentAllowed);
  const actionName = canZap ? "Zap" : "Tip";

  const onSubmitZap = handleSubmit(onSubmit);

  return (
    <form onSubmit={onSubmitZap}>
      <Flex gap="4" direction="column">
        {splits.map((p) => (
          <UserCard key={p.pubkey} pubkey={p.pubkey} percent={p.percent} />
        ))}

        {showEmbed && event && <EmbedEvent event={event} {...embedProps} />}

        {showComment && (
          <Input
            placeholder="Comment"
            {...register("comment", { maxLength: lnurlMetadata?.commentAllowed ?? 150 })}
            autoComplete="off"
          />
        )}

        <CustomZapAmountOptions onSelect={(amount) => setValue("amount", amount, { shouldDirty: true })} />

        <Flex gap="2">
          <Input
            type="number"
            placeholder="Custom amount"
            isInvalid={!!errors.amount}
            step={1}
            flex={1}
            {...register("amount", { valueAsNumber: true, min: 1 })}
          />
          <Button leftIcon={<LightningIcon />} type="submit" isLoading={isSubmitting} variant="solid" size="md">
            {actionName} {readablizeSats(watch("amount"))} sats
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
