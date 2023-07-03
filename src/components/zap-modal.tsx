import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  ModalProps,
  Text,
  useToast,
} from "@chakra-ui/react";
import { DraftNostrEvent, NostrEvent } from "../types/nostr-event";
import { useForm } from "react-hook-form";
import { UserAvatar } from "./user-avatar";
import { UserLink } from "./user-link";
import { parsePaymentRequest, readablizeSats } from "../helpers/bolt11";
import { LightningIcon } from "./icons";
import { Kind } from "nostr-tools";
import clientRelaysService from "../services/client-relays";
import { getEventRelays } from "../services/event-relays";
import { useSigningContext } from "../providers/signing-provider";
import appSettings from "../services/app-settings";
import useSubject from "../hooks/use-subject";
import useUserLNURLMetadata from "../hooks/use-user-lnurl-metadata";
import { requestZapInvoice } from "../helpers/zaps";
import { ParsedStream, getATag } from "../helpers/nostr/stream";
import EmbeddedNote from "./note/embedded-note";
import dayjs from "dayjs";
import { unique } from "../helpers/array";
import { useUserRelays } from "../hooks/use-user-relays";
import { RelayMode } from "../classes/relay";
import relayScoreboardService from "../services/relay-scoreboard";

type FormValues = {
  amount: number;
  comment: string;
};

export type ZapModalProps = Omit<ModalProps, "children"> & {
  pubkey: string;
  event?: NostrEvent;
  stream?: ParsedStream;
  initialComment?: string;
  initialAmount?: number;
  onInvoice: (invoice: string) => void;
  allowComment?: boolean;
  showEventPreview?: boolean;
};

export default function ZapModal({
  event,
  pubkey,
  stream,
  onClose,
  initialComment,
  initialAmount,
  onInvoice,
  allowComment = true,
  showEventPreview = true,
  ...props
}: ZapModalProps) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const { customZapAmounts } = useSubject(appSettings);
  const userReadRelays = useUserRelays(pubkey)
    .filter((r) => r.mode & RelayMode.READ)
    .map((r) => r.url);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: {
      amount: initialAmount ?? (parseInt(customZapAmounts.split(",")[0]) || 100),
      comment: initialComment ?? "",
    },
  });

  const { metadata: lnurlMetadata, address: tipAddress } = useUserLNURLMetadata(pubkey);

  const canZap = lnurlMetadata?.allowsNostr && lnurlMetadata?.nostrPubkey;
  const actionName = canZap ? "Zap" : "Tip";

  const onSubmitZap = handleSubmit(async (values) => {
    try {
      if (!tipAddress) throw new Error("No lightning address");
      if (lnurlMetadata) {
        const amountInMilisat = values.amount * 1000;

        if (amountInMilisat > lnurlMetadata.maxSendable) throw new Error("amount to large");
        if (amountInMilisat < lnurlMetadata.minSendable) throw new Error("amount to small");
        if (canZap) {
          const eventRelays = event ? getEventRelays(event.id).value : [];
          const eventRelaysRanked = relayScoreboardService.getRankedRelays(eventRelays).slice(0, 4);
          const writeRelays = clientRelaysService.getWriteUrls();
          const writeRelaysRanked = relayScoreboardService.getRankedRelays(writeRelays).slice(0, 4);
          const userReadRelaysRanked = relayScoreboardService.getRankedRelays(userReadRelays).slice(0, 4);

          const zapRequest: DraftNostrEvent = {
            kind: Kind.ZapRequest,
            created_at: dayjs().unix(),
            content: values.comment,
            tags: [
              ["p", pubkey],
              ["relays", ...unique([...writeRelaysRanked, ...userReadRelaysRanked, ...eventRelaysRanked])],
              ["amount", String(amountInMilisat)],
            ],
          };
          if (event) zapRequest.tags.push(["e", event.id]);
          if (stream) zapRequest.tags.push(["a", getATag(stream)]);

          const signed = await requestSignature(zapRequest);
          if (signed) {
            const payRequest = await requestZapInvoice(signed, lnurlMetadata.callback);
            await onInvoice(payRequest);
          }
        } else {
          const callbackUrl = new URL(lnurlMetadata.callback);
          callbackUrl.searchParams.append("amount", String(amountInMilisat));
          if (values.comment) callbackUrl.searchParams.append("comment", values.comment);

          const { pr: payRequest } = await fetch(callbackUrl).then((res) => res.json());
          if (payRequest as string) {
            const parsed = parsePaymentRequest(payRequest);
            if (parsed.amount !== amountInMilisat) throw new Error("incorrect amount");

            await onInvoice(payRequest);
          } else throw new Error("Failed to get invoice");
        }
      } else throw new Error("Failed to get LNURL metadata");
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
  });

  return (
    <Modal onClose={onClose} size="xl" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody padding="4">
          <form onSubmit={onSubmitZap}>
            <Flex gap="4" direction="column">
              <Flex gap="2" alignItems="center" overflow="hidden">
                <UserAvatar pubkey={pubkey} size="md" />
                <Box>
                  <UserLink pubkey={pubkey} fontWeight="bold" />
                  <Text isTruncated>{tipAddress}</Text>
                </Box>
              </Flex>

              {showEventPreview && stream && (
                <Box>
                  <Heading size="sm" mb="2">
                    Stream: {stream.title}
                  </Heading>
                  {stream.image && <Image src={stream.image} />}
                </Box>
              )}
              {showEventPreview && event && <EmbeddedNote note={event} />}

              {allowComment && (canZap || lnurlMetadata?.commentAllowed) && (
                <Input
                  placeholder="Comment"
                  {...register("comment", { maxLength: lnurlMetadata?.commentAllowed ?? 150 })}
                  autoComplete="off"
                  autoFocus={!initialComment}
                />
              )}

              <Flex gap="2" alignItems="center" flexWrap="wrap">
                {customZapAmounts
                  .split(",")
                  .map((v) => parseInt(v))
                  .map((amount, i) => (
                    <Button
                      key={amount + i}
                      onClick={() => {
                        setValue("amount", amount);
                      }}
                      leftIcon={<LightningIcon color="yellow.400" />}
                      variant="solid"
                    >
                      {amount}
                    </Button>
                  ))}
              </Flex>

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
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
