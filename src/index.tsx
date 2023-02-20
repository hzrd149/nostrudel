import moment from "moment";
import { createRoot } from "react-dom/client";
// import the nostr-tools index to apply patch to secp256k1
// https://github.com/nbd-wtf/nostr-tools/blob/a330b975903758737ae2b455d5cfd7b99d33ad35/index.ts#L17
import "nostr-tools";
import { App } from "./app";
import { Providers } from "./providers";

import "./services/pubkey-relay-weights";

const element = document.getElementById("root");
if (!element) throw new Error("missing mount point");
const root = createRoot(element);
root.render(
  <Providers>
    <App />
  </Providers>
);

if (import.meta.env.DEV) {
  window.moment = moment;
}
