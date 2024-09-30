import { SerialPortSigner } from "applesauce-signer";
import { alwaysVerify } from "./verify-event";

/** @deprecated use SerialPortSigner class instead */
const serialPortService = new SerialPortSigner();
serialPortService.verifyEvent = alwaysVerify;

setInterval(() => {
  if (serialPortService.isConnected) {
    serialPortService.ping();
  }
}, 1000 * 10);

export default serialPortService;
