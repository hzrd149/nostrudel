import { Suspense, lazy, useState } from "react";
import {
  Button,
  IconButton,
  IconButtonProps,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";

import { CAP_IS_NATIVE } from "../../env";
import { logger } from "../../helpers/debug";
import { QrCodeIcon } from "../icons";
import { installNativeScanner, scanSingle } from "./native-scanner";

const BarcodeScannerComponent = lazy(() => import("react-qr-barcode-scanner"));
const log = logger.extend("QRCodeScanner");

export default function QRCodeScannerButton({
  onResult,
  ...props
}: { onResult: (data: string) => void } & Omit<IconButtonProps, "icon" | "aria-label">) {
  const toast = useToast();
  const modal = useDisclosure();

  const [stopStream, setStopStream] = useState(false);
  const closeModal = (result?: string) => {
    // Stop the QR Reader stream (fixes issue where the browser freezes when closing the modal) and then dismiss the modal one tick later
    setStopStream(true);
    setTimeout(() => {
      modal.onClose();
      if (result) onResult(result);
    }, 0);
  };

  const handleClick = async () => {
    if (CAP_IS_NATIVE) {
      try {
        await installNativeScanner();

        try {
          const result = await scanSingle();
          onResult(result.barcodes[0].rawValue);
        } catch (error) {
          // user cancel
        }
      } catch (error) {
        log(error);
        if (import.meta.env.DEV && error instanceof Error) toast({ status: "error", description: error.message });

        modal.onOpen();
      }
    } else modal.onOpen();
  };

  return (
    <>
      <IconButton onClick={handleClick} icon={<QrCodeIcon boxSize={6} />} aria-label="Qr Scanner" {...props} />
      {modal.isOpen && (
        <Suspense fallback={null}>
          <Modal isOpen={modal.isOpen} onClose={closeModal}>
            <ModalOverlay />
            <ModalContent>
              <ModalBody p="2">
                <BarcodeScannerComponent
                  stopStream={stopStream}
                  onUpdate={(_err, result) => {
                    if (result && result.getText()) closeModal(result.getText());
                  }}
                />
              </ModalBody>

              <ModalFooter px="2" pb="2" pt="0" alignItems="center" gap="2">
                <Button onClick={() => closeModal()}>Cancel</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Suspense>
      )}
    </>
  );
}
