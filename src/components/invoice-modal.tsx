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
import { ExternalLinkIcon, LightningIcon, QrCodeIcon } from "./icons";
import QrCodeSvg from "./qr-code-svg";
import { CopyIconButton } from "./copy-icon-button";
import { useIsMobile } from "../hooks/use-is-mobile";

export default function InvoiceModal({
  invoice,
  onClose,
  onPaid,
  ...props
}: Omit<ModalProps, "children"> & { invoice: string; onPaid: () => void }) {
  const isMobile = useIsMobile();
  const toast = useToast();
  const showQr = useDisclosure();

  const payWithWebLn = async (invoice: string) => {
    if (window.webln && invoice) {
      if (!window.webln.enabled) await window.webln.enable();
      await window.webln.sendPayment(invoice);

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

  return (
    <Modal onClose={onClose} {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody padding="4">
          <Flex gap="4" direction="column">
            {showQr.isOpen && <QrCodeSvg content={invoice} />}
            <Flex gap="2">
              <Input value={invoice} readOnly />
              <IconButton
                icon={<QrCodeIcon />}
                aria-label="Show QrCode"
                onClick={showQr.onToggle}
                variant="solid"
                size="md"
              />
              <CopyIconButton text={invoice} aria-label="Copy Invoice" variant="solid" size="md" />
            </Flex>
            <Flex gap="2">
              {window.webln && (
                <Button onClick={() => payWithWebLn(invoice)} flex={1} variant="solid" size="md">
                  Pay with WebLN
                </Button>
              )}
              <Button
                leftIcon={<ExternalLinkIcon />}
                onClick={() => payWithApp(invoice)}
                flex={1}
                variant="solid"
                size="md"
              >
                Open App
              </Button>
            </Flex>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
