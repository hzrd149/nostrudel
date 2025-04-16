import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { filter, merge, Subject } from "rxjs";
import {
  Button,
  IconButton,
  IconButtonProps,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Progress,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { receiveAnimated } from "applesauce-wallet/helpers/animated-qr";

import { QrCodeIcon } from "../icons";

const BarcodeScannerComponent = lazy(() => import("react-qr-barcode-scanner"));

export default function AnimatedQRCodeScannerButton({
  onResult,
  ...props
}: { onResult: (data: string) => void } & Omit<IconButtonProps, "icon" | "aria-label">) {
  const toast = useToast();
  const modal = useDisclosure();

  const [progress, setProgress] = useState<number>();
  const [subject, setSubject] = useState<Subject<string>>();

  const openModal = useCallback(() => {
    setSubject(new Subject());
    modal.onOpen();
  }, [modal.onOpen, setSubject]);

  const [stopStream, setStopStream] = useState(false);
  const closeModal = useCallback(() => {
    // Stop the QR Reader stream (fixes issue where the browser freezes when closing the modal) and then dismiss the modal one tick later
    setStopStream(true);
    setTimeout(() => modal.onClose(), 0);
  }, [setStopStream, modal.onClose]);

  const result = useRef(onResult);
  result.current = onResult;

  // listen to the scanning stream
  useEffect(() => {
    if (subject) {
      setProgress(undefined);

      const normal = subject.pipe(filter((part) => !part.startsWith("ur:bytes")));
      const animated = subject.pipe(receiveAnimated);

      const sub = merge(normal, animated).subscribe({
        next: (part) => {
          if (typeof part === "number") {
            // progress
            setProgress(part);
          } else if (part) {
            // close the javascript scanner
            closeModal();
            // wait for steam to be stopped before returning data
            setTimeout(() => {
              result.current(part);
            }, 0);
          }
        },
        error: (err) => {
          if (err instanceof Error) toast({ status: "error", description: err.message });
          closeModal();
        },
      });
      return () => sub.unsubscribe();
    }
  }, [subject, closeModal, setProgress]);

  return (
    <>
      <IconButton onClick={openModal} icon={<QrCodeIcon boxSize={6} />} aria-label="Qr Scanner" {...props} />
      {modal.isOpen && (
        <Suspense fallback={null}>
          <Modal isOpen={modal.isOpen} onClose={closeModal}>
            <ModalOverlay />
            <ModalContent>
              <ModalBody p="2">
                <BarcodeScannerComponent
                  stopStream={stopStream}
                  onUpdate={(err, result) => {
                    if (subject && result && result.getText()) subject.next(result.getText());
                  }}
                  onError={(err) => {
                    if (!subject) return;
                    if (err instanceof Error) subject.error(err);
                    else subject.error(new Error(err));
                  }}
                />
              </ModalBody>

              <ModalFooter px="2" pb="2" pt="0" alignItems="center" gap="2">
                {progress !== undefined && <Progress hasStripe value={progress * 100} w="full" />}
                <Button onClick={closeModal}>Cancel</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Suspense>
      )}
    </>
  );
}
