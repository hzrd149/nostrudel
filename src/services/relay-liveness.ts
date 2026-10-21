import { RelayLiveness } from "applesauce-relay";
import localforage from "localforage";
import { distinctUntilChanged } from "rxjs";

import { AppRelayLiveness } from "../classes/app-relay-liveness";
import { NIP66_MONITOR_RELAYS } from "../const";
import { logger } from "../helpers/debug";
import { eventStore } from "./event-store";
import localSettings from "./preferences";

const log = logger.extend("RelayLiveness");

const local = new RelayLiveness({
  backoffBaseDelay: 5000,
  storage: localforage.createInstance({ name: "liveness" }),
});
local.load().catch((err) => log("Failed to load relay liveness", err));

/** The liveness source the relay pool uses to skip unhealthy relays */
const liveness = new AppRelayLiveness(eventStore, NIP66_MONITOR_RELAYS, local);

localSettings.localRelayLiveness.subscribe((enabled) => liveness.setLocalEnabled(enabled));
localSettings.relayLivenessMonitors
  // Only rebuild the remote monitors when the selection actually changes
  .pipe(distinctUntilChanged((a, b) => a.join(",") === b.join(",")))
  .subscribe((monitors) => liveness.setMonitors(monitors));

if (import.meta.env.DEV) {
  Reflect.set(window, "liveness", liveness);
}

export default liveness;
