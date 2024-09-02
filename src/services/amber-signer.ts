import { alwaysVerify } from "./verify-event";
import AmberSigner from "../classes/signers/amber-signer";

/** @deprecated nip NostrConnectClient instead */
const amberSignerService = new AmberSigner();
amberSignerService.verifyEvent = alwaysVerify;

if (import.meta.env.DEV) {
  // @ts-ignore
  window.amberSignerService = amberSignerService;
}

export default amberSignerService;
