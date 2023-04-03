import {
  Button,
  ButtonGroup,
  DefaultIcon,
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
import { parsePaymentRequest, readablizeSats } from "../helpers/bolt11";
import { ExternalLinkIcon, LightningIcon, QrCodeIcon } from "./icons";
import lnurlMetadataService from "../services/lnurl-metadata";
import { useAsync } from "react-use";
import { nip57 } from "nostr-tools";
import clientRelaysService from "../services/client-relays";
import { getEventRelays } from "../services/event-relays";
import { useSigningContext } from "../providers/signing-provider";
import QrCodeSvg from "./qr-code-svg";
import { CopyIconButton } from "./copy-icon-button";
import { useIsMobile } from "../hooks/use-is-mobile";
import settings from "../services/settings";

type FormValues = {
  amount: number;
  comment: string;
};

export type ZapModalProps = Omit<ModalProps, "children"> & {
  event?: NostrEvent;
  pubkey: string;
  onPaid?: () => void;
  initialComment?: string;
  initialAmount?: number;
};

export default function ZapModal({
  event,
  pubkey,
  onClose,
  onPaid,
  initialComment,
  initialAmount,
  ...props
}: ZapModalProps) {
  const metadata = useUserMetadata(pubkey);
  const { requestSignature } = useSigningContext();
  const toast = useToast();
  const [promptInvoice, setPromptInvoice] = useState<string>();
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
      amount: initialAmount ?? 10,
      comment: initialComment ?? "",
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
      if (!tipAddress) throw new Error("No lightning address");
      if (lnurlMetadata) {
        const amountInMilisat = values.amount * 1000;

        if (amountInMilisat > lnurlMetadata.maxSendable) throw new Error("amount to large");
        if (amountInMilisat < lnurlMetadata.minSendable) throw new Error("amount to small");
        if (canZap) {
          const otherRelays = event ? getEventRelays(event.id).value : [];
          const readRelays = clientRelaysService.getReadUrls();

          const zapRequest = nip57.makeZapRequest({
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

              payInvoice(payRequest);
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

            payInvoice(payRequest);
          } else throw new Error("Failed to get invoice");
        }
      } else throw new Error("Failed to get LNURL metadata");
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
  };

  const payWithWebLn = async (invoice: string) => {
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
  const payWithApp = async (invoice: string) => {
    window.open("lightning:" + invoice);

    const listener = () => {
      if (document.visibilityState === "visible") {
        if (onPaid) onPaid();
        onClose();
        document.removeEventListener("visibilitychange", listener);
      }
    };
    setTimeout(() => {
      document.addEventListener("visibilitychange", listener);
    }, 1000 * 2);
  };

  const payInvoice = (invoice: string) => {
    switch (settings.lightningPayMode.value) {
      case "webln":
        payWithWebLn(invoice);
        break;
      case "external":
        payWithApp(invoice);
        break;
      default:
      case "prompt":
        setPromptInvoice(invoice);
        break;
    }
  };

  const handleClose = () => {
    // if there was an invoice and we are closing the modal. presume it was paid
    if (promptInvoice && onPaid) {
      onPaid();
    }
    onClose();
  };

  return (
    <Modal onClose={handleClose} {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody padding="4">
          {promptInvoice ? (
            <Flex gap="4" direction="column">
              {showQr && <QrCodeSvg content={promptInvoice} />}
              <Flex gap="2">
                <Input value={promptInvoice} readOnly />
                <IconButton
                  icon={<QrCodeIcon />}
                  aria-label="Show QrCode"
                  onClick={toggleQr}
                  variant="solid"
                  size="md"
                />
                <CopyIconButton text={promptInvoice} aria-label="Copy Invoice" variant="solid" size="md" />
              </Flex>
              <Flex gap="2">
                {window.webln && (
                  <Button onClick={() => payWithWebLn(promptInvoice)} flex={1} variant="solid" size="md">
                    Pay with WebLN
                  </Button>
                )}
                <Button
                  leftIcon={<ExternalLinkIcon />}
                  onClick={() => payWithApp(promptInvoice)}
                  flex={1}
                  variant="solid"
                  size="md"
                >
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
                  {actionName} {getUserDisplayName(metadata, pubkey)} {readablizeSats(watch("amount"))} sats
                </Button>
              </Flex>
            </form>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
