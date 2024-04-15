import { setNostrWasm, verifyEvent } from "nostr-tools/wasm";
import { initNostrWasm } from "nostr-wasm";

const wasm = await initNostrWasm();
setNostrWasm(wasm);

export default verifyEvent;
