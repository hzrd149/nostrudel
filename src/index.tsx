import moment from "moment";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { Providers } from "./providers";

// register nostr: protocol handler
try {
  navigator.registerProtocolHandler("web+nostr", new URL("/l/%s", location.origin).toString());
} catch (e) {
  console.log("Failed to register handler");
  console.log(e);
}

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
