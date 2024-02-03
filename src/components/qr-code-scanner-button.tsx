import { IconButton, Spinner, useDisclosure } from "@chakra-ui/react";
import { type QrScannerModalProps } from "./qr-scanner-modal";
import { QrCodeIcon } from "./icons";
import { Suspense, lazy } from "react";

const QrScannerModal = lazy(() => import("./qr-scanner-modal"));

export default function QRCodeScannerButton({ onData }: { onData: QrScannerModalProps["onData"] }) {
  const modal = useDisclosure();

  return (
    <>
      <IconButton onClick={modal.onOpen} icon={<QrCodeIcon boxSize={6} />} aria-label="Qr Scanner" />
      {modal.isOpen && (
        <Suspense fallback={null}>
          <QrScannerModal isOpen={modal.isOpen} onClose={modal.onClose} onData={onData} />
        </Suspense>
      )}
    </>
  );
}
