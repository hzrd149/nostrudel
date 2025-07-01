import "./polyfill";

import { GlobalProviders } from "./providers/global";
import { registerServiceWorker } from "./services/worker";

import "./services/debug-api";
import "./services/lifecycle";
import "./services/username-search";
import "./services/decryption-cache";

// setup bitcoin connect
import { init, onConnected } from "@getalby/bitcoin-connect-react";
init({ appName: "noStrudel" });
onConnected((provider) => {
  window.webln = provider;
});

// When the app closes, remove the bitcoin-connect config if its set to extension
// This prevents it from prompting the user to authorize or unlock their extension when the app is opened
window.addEventListener("unload", () => {
  const config = localStorage.getItem("bc:config");
  if (config && JSON.parse(config).connectorType === "extension.generic") {
    localStorage.removeItem("bc:config");
  }
});

// setup dayjs
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTimePlugin from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTimePlugin);
dayjs.extend(localizedFormat);

// register nostr: protocol handler
if (import.meta.env.PROD) {
  try {
    navigator.registerProtocolHandler("web+nostr", new URL("/l/%s", location.origin).toString());
  } catch (e) {
    console.log("Failed to register handler");
    console.log(e);
  }
}

// mount react app
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { logger } from "./helpers/debug";
import { CAP_IS_WEB } from "./env";

logger("Rendering app");
const root = document.getElementById("root")!;
createRoot(root).render(
  <GlobalProviders>
    <App />
  </GlobalProviders>,
);

// Register service worker if supported
if (CAP_IS_WEB && "serviceWorker" in navigator) registerServiceWorker();
