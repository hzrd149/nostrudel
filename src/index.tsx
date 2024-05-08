import "./polyfill";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { GlobalProviders } from "./providers/global";
import "./services/user-event-sync";
import "./services/username-search";
import "./services/web-of-trust";

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
dayjs.extend(relativeTimePlugin);
import localizedFormat from "dayjs/plugin/localizedFormat";
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

const element = document.getElementById("root");
if (!element) throw new Error("missing mount point");
const root = createRoot(element);
root.render(
  <GlobalProviders>
    <App />
  </GlobalProviders>,
);
