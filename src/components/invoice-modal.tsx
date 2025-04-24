import { useState } from "react";
import {
  Button,
  Flex,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  ModalProps,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";

import { ExternalLinkIcon, QrCodeIcon } from "./icons";
import QrCodeSvg from "./qr-code/qr-code-svg";
import { CopyIconButton } from "./copy-icon-button";

type CommonProps = { invoice: string; onPaid: () => void };

export function InvoiceModalContent({ invoice, onPaid }: CommonProps) {
  const toast = useToast();
  const showQr = useDisclosure();
  const [payingWebLn, setPayingWebLn] = useState(false);
  const [payingApp, setPayingApp] = useState(false);

  const payWithWebLn = async (invoice: string) => {
    try {
      if (window.webln && invoice) {
        setPayingWebLn(true);
        if (!window.webln.enabled) await window.webln.enable();
        await window.webln.sendPayment(invoice);

        if (onPaid) onPaid();
      }
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setPayingWebLn(false);
  };
  const payWithApp = async (invoice: string) => {
    setPayingApp(true);
    window.open("lightning:" + invoice);

    const listener = () => {
      if (document.visibilityState === "visible") {
        if (onPaid) onPaid();
        document.removeEventListener("visibilitychange", listener);
        setPayingApp(false);
      }
    };
    setTimeout(() => {
      document.addEventListener("visibilitychange", listener);
    }, 1000 * 2);
  };

  return (
    <Flex gap="2" direction="column">
      {showQr.isOpen && <QrCodeSvg content={invoice} maxW="4in" mx="auto" aria-label="Payment QR code" />}
      <Flex gap="2">
        <Input value={invoice} userSelect="all" onChange={() => {}} aria-label="Lightning invoice" readOnly />
        <IconButton
          icon={<QrCodeIcon boxSize={6} />}
          aria-label="Show QR code"
          onClick={showQr.onToggle}
          variant="solid"
          size="md"
          aria-pressed={showQr.isOpen}
        />
        <CopyIconButton value={invoice} aria-label="Copy invoice" variant="solid" size="md" />
      </Flex>
      <Flex gap="2">
        {window.webln && (
          <Button
            onClick={() => payWithWebLn(invoice)}
            flex={1}
            variant="solid"
            size="md"
            isLoading={payingWebLn}
            aria-label="Pay with WebLN"
          >
            Pay with WebLN
          </Button>
        )}
        <Button
          leftIcon={<ExternalLinkIcon />}
          onClick={() => payWithApp(invoice)}
          flex={1}
          variant="solid"
          size="md"
          isLoading={payingApp}
          aria-label="Open in lightning app"
        >
          Open App
        </Button>
      </Flex>
    </Flex>
  );
}

export default function InvoiceModal({
  invoice,
  onClose,
  onPaid,
  ...props
}: Omit<ModalProps, "children"> & CommonProps) {
  return (
    <Modal onClose={onClose} {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody padding="4" role="region" aria-label="Payment options">
          <InvoiceModalContent
            invoice={invoice}
            onPaid={() => {
              if (onPaid) onPaid();
              onClose();
            }}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
