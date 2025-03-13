import { ScanResult, type Barcode } from "@capacitor-mlkit/barcode-scanning";
import { Observable, Subject } from "rxjs";

import { logger } from "../../helpers/debug";

const log = logger.extend("NativeQrCodeScanner");

export async function installNativeScanner(): Promise<boolean> {
  const { BarcodeScanner, GoogleBarcodeScannerModuleInstallState } = await import("@capacitor-mlkit/barcode-scanning");

  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
  if (!available) {
    // install barcode scanner
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

  return true;
}

export async function getScanningStream(): Promise<Observable<Barcode>> {
  const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");

  const subject = new Subject<Barcode>();
  await BarcodeScanner.addListener("barcodesScanned", (event) => {
    for (const barcode of event.barcodes) {
      subject.next(barcode);
    }
  });

  await BarcodeScanner.addListener("scanError", (event) => {
    subject.error(new Error(event.message));
  });

  return subject;
}

export async function startScanning(): Promise<void> {
  const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");
  await BarcodeScanner.startScan();
}

export async function stopScanning(): Promise<void> {
  const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");
  await BarcodeScanner.removeAllListeners();
  await BarcodeScanner.stopScan();
}

export async function scanSingle(): Promise<ScanResult> {
  const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");
  return await BarcodeScanner.scan();
}
