import moment from "moment";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { Providers } from "./providers";
import "./services/events-seen";

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
