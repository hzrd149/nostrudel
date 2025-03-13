import { Barcode, BarcodeScannerPlugin } from "@capacitor-mlkit/barcode-scanning";
import { from, Observable, switchMap } from "rxjs";
import { PluginListenerHandle } from "@capacitor/core";

import { logger } from "../../helpers/debug";

const log = logger.extend("NativeQrCodeScanner");

export async function getNativeScanner(): Promise<BarcodeScannerPlugin> {
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

  return BarcodeScanner;
}

export function getNativeScanStream(scanner: BarcodeScannerPlugin): Observable<Barcode> {
  return new Observable<Barcode>((observer) => {
    const sub = scanner.addListener("barcodesScanned", (event) => {
      for (const barcode of event.barcodes) {
        observer.next(barcode);
      }
    });

    scanner.startScan();

    let handle: PluginListenerHandle | undefined = undefined;
    sub.then((e) => (handle = e));

    return () => {
      if (handle) handle.remove();
      else sub.then((handle) => handle.remove);

      scanner.stopScan();
    };
  });
}
