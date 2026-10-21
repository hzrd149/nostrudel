import { RelayLiveness } from "applesauce-relay";
import localforage from "localforage";

import { AppRelayLiveness } from "../classes/app-relay-liveness";
import { NIP66_MONITOR_RELAYS } from "../const";
import { eventStore } from "./event-store";
import localSettings from "./preferences";

const local = new RelayLiveness({
  backoffBaseDelay: 5000,
  storage: localforage.createInstance({ name: "liveness" }),
});
local.load();

/** The liveness source the relay pool uses to skip unhealthy relays */
const liveness = new AppRelayLiveness(eventStore, NIP66_MONITOR_RELAYS, local);

localSettings.localRelayLiveness.subscribe((enabled) => liveness.setLocalEnabled(enabled));
localSettings.relayLivenessMonitors.subscribe((monitors) => liveness.setMonitors(monitors));

if (import.meta.env.DEV) {
  Reflect.set(window, "liveness", liveness);
}

export default liveness;
