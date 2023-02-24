import {
  Button,
  ButtonGroup,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  ModalProps,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { getUserDisplayName } from "../helpers/user-metadata";
import { NostrEvent } from "../types/nostr-event";
import { SubmitHandler, useForm } from "react-hook-form";
import { UserAvatar } from "./user-avatar";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { UserLink } from "./user-link";
import { parsePaymentRequest, readableAmountInSats } from "../helpers/bolt11";
import { ExternalLinkIcon, LightningIcon, QrCodeIcon } from "./icons";
import lnurlMetadataService from "../services/lnurl-metadata";
import { useAsync } from "react-use";
import { makeZapRequest } from "nostr-tools/nip57";
import clientRelaysService from "../services/client-relays";
import { getEventRelays } from "../services/event-relays";
import { useSigningContext } from "../providers/signing-provider";
import QrCodeSvg from "./qr-code-svg";
import { CopyIconButton } from "./copy-icon-button";
import { useIsMobile } from "../hooks/use-is-mobile";

type FormValues = {
  amount: number;
  comment: string;
};

export default function ZapModal({
  event,
  pubkey,
  onClose,
  onPaid,
  ...props
}: { event?: NostrEvent; pubkey: string; onPaid?: () => void } & Omit<ModalProps, "children">) {
  const metadata = useUserMetadata(pubkey);
  const { requestSignature } = useSigningContext();
  const toast = useToast();
  const [invoice, setInvoice] = useState<string>();
  const { isOpen: showQr, onToggle: toggleQr } = useDisclosure();
  const isMobile = useIsMobile();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: {
      amount: 10,
      comment: "",
    },
  });

  const tipAddress = metadata?.lud06 || metadata?.lud16;
  const { value: lnurlMetadata } = useAsync(
    async () => (tipAddress ? lnurlMetadataService.requestMetadata(tipAddress) : undefined),
    [tipAddress]
  );

  const canZap = lnurlMetadata?.allowsNostr && lnurlMetadata?.nostrPubkey;
  const actionName = canZap ? "Zap" : "Tip";

  const onSubmitZap: SubmitHandler<FormValues> = async (values) => {
    try {
      if (lnurlMetadata) {
        const amountInMilisat = values.amount * 1000;

        if (amountInMilisat > lnurlMetadata.maxSendable) throw new Error("amount to large");
        if (amountInMilisat < lnurlMetadata.minSendable) throw new Error("amount to small");
        if (canZap) {
          const otherRelays = event ? getEventRelays(event.id).value : [];
          const readRelays = clientRelaysService.getReadUrls();

          const zapRequest = makeZapRequest({
            profile: pubkey,
            event: event?.id ?? null,
            relays: [...otherRelays, ...readRelays],
            amount: amountInMilisat,
            comment: values.comment,
          });

          const signed = await requestSignature(zapRequest);
          if (signed) {
            const callbackUrl = new URL(lnurlMetadata.callback);
            callbackUrl.searchParams.append("amount", String(amountInMilisat));
            callbackUrl.searchParams.append("nostr", JSON.stringify(signed));

            const { pr: payRequest } = await fetch(callbackUrl).then((res) => res.json());

            if (payRequest as string) {
              const parsed = parsePaymentRequest(payRequest);
              if (parsed.amount !== amountInMilisat) throw new Error("incorrect amount");

              setInvoice(payRequest);
            } else throw new Error("Failed to get invoice");
          }
        } else {
          const callbackUrl = new URL(lnurlMetadata.callback);
          callbackUrl.searchParams.append("amount", String(amountInMilisat));
          if (values.comment) callbackUrl.searchParams.append("comment", values.comment);

          const { pr: payRequest } = await fetch(callbackUrl).then((res) => res.json());
          if (payRequest as string) {
            const parsed = parsePaymentRequest(payRequest);
            if (parsed.amount !== amountInMilisat) throw new Error("incorrect amount");

            setInvoice(payRequest);
          } else throw new Error("Failed to get invoice");
        }
      } else throw new Error("No lightning address");
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
  };

  const payWithWebLn = async () => {
    if (window.webln && invoice) {
      if (!window.webln.enabled) await window.webln.enable();
      await window.webln.sendPayment(invoice);

      toast({
        title: actionName + " sent",
        status: "success",
        duration: 3000,
      });

      if (onPaid) onPaid();
      onClose();
    }
  };
  const payWithApp = async () => {
    window.open("lightning:" + invoice);

    window.addEventListener(
      "focus",
      () => {
        if (onPaid) onPaid();
        onClose();
      },
      { once: true }
    );
  };

  return (
    <Modal onClose={onClose} {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody padding="4">
          {invoice ? (
            <Flex gap="4" direction="column">
              {showQr && <QrCodeSvg content={invoice} />}
              <Flex gap="2">
                <Input value={invoice} readOnly />
                <IconButton
                  icon={<QrCodeIcon />}
                  aria-label="Show QrCode"
                  onClick={toggleQr}
                  variant="solid"
                  size="md"
                />
                <CopyIconButton text={invoice} aria-label="Copy Invoice" variant="solid" size="md" />
              </Flex>
              <Flex gap="2">
                {window.webln && (
                  <Button onClick={payWithWebLn} flex={1} variant="solid" size="md">
                    Pay with WebLN
                  </Button>
                )}
                <Button leftIcon={<ExternalLinkIcon />} onClick={payWithApp} flex={1} variant="solid" size="md">
                  Open App
                </Button>
              </Flex>
            </Flex>
          ) : (
            <form onSubmit={handleSubmit(onSubmitZap)}>
              <Flex gap="4" direction="column">
                <Flex gap="2" alignItems="center">
                  <UserAvatar pubkey={pubkey} size="sm" />
                  <Text>{actionName}</Text>
                  <UserLink pubkey={pubkey} />
                </Flex>
                <Flex gap="2" alignItems="center">
                  <ButtonGroup>
                    <Button onClick={() => setValue("amount", 10)}>10</Button>
                    <Button onClick={() => setValue("amount", 100)}>100</Button>
                    <Button onClick={() => setValue("amount", 500)}>500</Button>
                    <Button onClick={() => setValue("amount", 1000)}>1K</Button>
                  </ButtonGroup>
                  <InputGroup maxWidth={32}>
                    {!isMobile && (
                      <InputLeftElement pointerEvents="none" color="gray.300" fontSize="1.2em">
                        <LightningIcon fontSize="1rem" />
                      </InputLeftElement>
                    )}
                    <Input
                      type="number"
                      placeholder="amount"
                      isInvalid={!!errors.amount}
                      step={1}
                      {...register("amount", { valueAsNumber: true, min: 1, required: true })}
                    />
                  </InputGroup>
                </Flex>
                {(canZap || lnurlMetadata?.commentAllowed) && (
                  <Input
                    placeholder="Comment"
                    {...register("comment", { maxLength: lnurlMetadata?.commentAllowed ?? 150 })}
                    autoComplete="off"
                  />
                )}
                <Button leftIcon={<LightningIcon />} type="submit" isLoading={isSubmitting} variant="solid" size="md">
                  {actionName} {getUserDisplayName(metadata, pubkey)} {readableAmountInSats(watch("amount") * 1000)}
                </Button>
              </Flex>
            </form>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
