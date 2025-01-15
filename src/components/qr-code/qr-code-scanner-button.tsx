import { Suspense, lazy, useCallback } from "react";
import { IconButton, useDisclosure, useToast } from "@chakra-ui/react";

import { type QrScannerModalProps } from "./qr-scanner-modal";
import { CAP_IS_NATIVE } from "../../env";
import { logger } from "../../helpers/debug";
import { QrCodeIcon } from "../icons";

const QrScannerModal = lazy(() => import("./qr-scanner-modal"));
const log = logger.extend("QRCodeScanner");

async function scanWithNative() {
  const { BarcodeScanner, BarcodeFormat, GoogleBarcodeScannerModuleInstallState } = await import(
    "@capacitor-mlkit/barcode-scanning"
  );
  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
  if (!available) {
    await BarcodeScanner.installGoogleBarcodeScannerModule();
    await new Promise<void>(async (res, rej) => {
      const sub = await BarcodeScanner.addListener("googleBarcodeScannerModuleInstallProgress", (event) => {
        log("Installing google barcode scanner", event.progress);
        switch (event.state) {
          case GoogleBarcodeScannerModuleInstallState.COMPLETED:
            sub.remove();
            res();
            break;
          case GoogleBarcodeScannerModuleInstallState.PENDING:
            log("Pending download");
            break;
          case GoogleBarcodeScannerModuleInstallState.DOWNLOADING:
            log("Downloading");
            break;
          case GoogleBarcodeScannerModuleInstallState.DOWNLOAD_PAUSED:
            log("Download paused");
            break;
          case GoogleBarcodeScannerModuleInstallState.INSTALLING:
            log("Installing");
            break;
          case GoogleBarcodeScannerModuleInstallState.FAILED:
            sub.remove();
            rej(new Error("Failed to install"));
            break;
          case GoogleBarcodeScannerModuleInstallState.CANCELED:
            sub.remove();
            rej(new Error("Canceled install"));
            break;
        }
      });
    });
  }

  const { supported } = await BarcodeScanner.isSupported();
  if (!supported) throw new Error("Unsupported");
  const { camera } = await BarcodeScanner.requestPermissions();
  const granted = camera === "granted" || camera === "limited";

  if (!granted) throw new Error("Camera access denied");

  try {
    const { barcodes } = await BarcodeScanner.scan({
      formats: [BarcodeFormat.QrCode],
    });

    const barcode = barcodes[0];
    if (!barcode) return null;

    return barcode.rawValue;
  } catch (error) {
    // user closed scanner
    return null;
  }
}

export default function QRCodeScannerButton({ onData }: { onData: QrScannerModalProps["onData"] }) {
  const toast = useToast();
  const modal = useDisclosure();

  const handleClick = useCallback(async () => {
    if (CAP_IS_NATIVE) {
      try {
        const result = await scanWithNative();
        if (result) onData(result);
      } catch (error) {
        log(error);
        if (import.meta.env.DEV && error instanceof Error) toast({ status: "error", description: error.message });

        modal.onOpen();
      }
    } else modal.onOpen();
  }, [modal.onOpen]);

  return (
    <>
      <IconButton onClick={handleClick} icon={<QrCodeIcon boxSize={6} />} aria-label="Qr Scanner" />
      {modal.isOpen && (
        <Suspense fallback={null}>
          <QrScannerModal isOpen={modal.isOpen} onClose={modal.onClose} onData={onData} />
        </Suspense>
      )}
    </>
  );
}
