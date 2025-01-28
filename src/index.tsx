import "./polyfill";
import { createRoot } from "react-dom/client";
import { GlobalProviders } from "./providers/global";

import "./services/user-event-sync";
import "./services/username-search";
import "./services/debug-api";

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
import relativeTimePlugin from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { CAP_IS_WEB } from "./env";
import { App } from "./app";
import { logger } from "./helpers/debug";
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

logger("Rendering app");
const root = document.getElementById("root")!;
createRoot(root).render(
  <GlobalProviders>
    <App />
  </GlobalProviders>,
);

// if web, register service worker
import { registerServiceWorker } from "./services/worker";
if (CAP_IS_WEB) {
  logger("Loading service worker");
  // const { registerServiceWorker } = await import("./services/worker");
  registerServiceWorker();
}
