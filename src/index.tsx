import "./polyfill";

import { CAP_IS_NATIVE, CAP_IS_WEB, IS_SERVICE_WORKER_SUPPORTED } from "./env";
import { GlobalProviders } from "./providers/global";
import { registerServiceWorker } from "./services/worker";
import { logger } from "./helpers/debug";
import { URLOpenListenerEvent, App as CapacitorApp } from "@capacitor/app";

import "./services/debug-api";
import "./services/decryption-cache";
import "./services/lifecycle";
import "./services/username-search";

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

// Import react components
import { createRoot } from "react-dom/client";
import { App, router } from "./app";

// register nostr: protocol handler
if (import.meta.env.PROD && CAP_IS_WEB) {
  try {
    navigator.registerProtocolHandler("web+nostr", new URL("/l/%s", location.origin).toString());
  } catch (e) {
    console.log("Failed to register handler");
  }
}

// Handle native nostr: links
if (CAP_IS_NATIVE) {
  CapacitorApp.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
    if (event.url.startsWith("nostr:")) {
      router.navigate("/l/" + event.url.replace(/^nostr:/, ""));
    }
  });
}

logger("Rendering app");
const root = document.getElementById("root")!;
createRoot(root).render(
  <GlobalProviders>
    <App />
  </GlobalProviders>,
);

// Register service worker if supported
if (IS_SERVICE_WORKER_SUPPORTED) registerServiceWorker();
