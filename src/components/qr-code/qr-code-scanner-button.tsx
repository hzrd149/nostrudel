import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { filter, map, merge, Observable, Subject } from "rxjs";
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

import { CAP_IS_NATIVE } from "../../env";
import { logger } from "../../helpers/debug";
import { QrCodeIcon } from "../icons";
import { getNativeScanner, getNativeScanStream } from "./native-scanner";

const BarcodeScannerComponent = lazy(() => import("react-qr-barcode-scanner"));
const log = logger.extend("QRCodeScanner");

export default function QRCodeScannerButton({
  onResult,
  ...props
}: { onResult: (data: string) => void } & Omit<IconButtonProps, "icon" | "aria-label">) {
  const toast = useToast();
  const modal = useDisclosure();

  const [progress, setProgress] = useState<number>();
  const [stream, setStream] = useState<Observable<string> | Subject<string>>();

  const openModal = useCallback(() => {
    setStream(new Subject());
    modal.onOpen();
  }, [modal.onOpen, setStream]);

  const [stopStream, setStopStream] = useState(false);
  const closeModal = useCallback(() => {
    // Stop the QR Reader stream (fixes issue where the browser freezes when closing the modal) and then dismiss the modal one tick later
    setStopStream(true);
    setTimeout(() => modal.onClose(), 0);
  }, [setStopStream, modal.onClose]);

  const openNative = useCallback(async () => {
    const scanner = await getNativeScanner();
    const stream = getNativeScanStream(scanner);
    setStream(stream.pipe(map((barcode) => barcode.rawValue)));
  }, [setStream]);

  const handleClick = useCallback(async () => {
    if (CAP_IS_NATIVE) {
      try {
        await openNative();
      } catch (error) {
        log(error);
        if (import.meta.env.DEV && error instanceof Error) toast({ status: "error", description: error.message });

        openModal();
      }
    } else openModal();
  }, [openModal, openNative]);

  // listen to the scanning stream
  useEffect(() => {
    if (stream) {
      setProgress(undefined);

      const normal = stream.pipe(filter((part) => !part.startsWith("ur:bytes")));
      const animated = stream.pipe(receiveAnimated);

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
              onResult(part);
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
  }, [stream, closeModal, onResult, setProgress]);

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
                  onUpdate={(err, result) => {
                    if (stream instanceof Subject && result && result.getText()) stream.next(result.getText());
                  }}
                  onError={(err) => {
                    if (!(stream instanceof Subject)) return;
                    if (err instanceof Error) stream.error(err);
                    else stream.error(new Error(err));
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
