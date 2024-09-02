import SerialPortSigner from "../classes/signers/serial-port-signer";
import { alwaysVerify } from "./verify-event";

/** @deprecated */
const serialPortService = new SerialPortSigner();
serialPortService.verifyEvent = alwaysVerify;

setInterval(() => {
  if (serialPortService.isConnected) {
    serialPortService.ping();
  }
}, 1000 * 10);

if (import.meta.env.DEV) {
  //@ts-ignore
  window.serialPortService = serialPortService;
}

export default serialPortService;
