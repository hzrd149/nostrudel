import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalOverlay, ModalProps } from "@chakra-ui/react";
import { useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

export type QrScannerModalProps = { onData: (text: string) => void } & Pick<ModalProps, "isOpen" | "onClose">;
export default function QrScannerModal({ isOpen, onClose, onData }: QrScannerModalProps) {
  const [stopStream, setStopStream] = useState(false);
  const handleClose = () => {
    // Stop the QR Reader stream (fixes issue where the browser freezes when closing the modal) and then dismiss the modal one tick later
    setStopStream(true);
    setTimeout(() => onClose(), 0);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody p="2">
          <BarcodeScannerComponent
            stopStream={stopStream}
            onUpdate={(err, result) => {
              if (result && result.getText()) {
                handleClose();
                // wait for steam to be stopped before returning data
                setTimeout(() => onData(result.getText()), 0);
              }
            }}
          />
        </ModalBody>

        <ModalFooter px="2" pb="2" pt="0">
          <Button onClick={handleClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
