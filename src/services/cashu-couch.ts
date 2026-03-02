import { IndexedDBCouch } from "applesauce-wallet/helpers";

/** Shared IndexedDB couch for safe cashu token operations.
 * Tokens are stored here during send/receive operations so they can be
 * recovered via RecoverFromCouch if something goes wrong mid-operation. */
const couch = new IndexedDBCouch();

export default couch;
