import { AmberClipboardSigner } from "applesauce-signer";
import { alwaysVerify } from "./verify-event";

/** @deprecated use AmberClipboardSigner class instead */
const amberSignerService = new AmberClipboardSigner();
amberSignerService.verifyEvent = alwaysVerify;

export default amberSignerService;
