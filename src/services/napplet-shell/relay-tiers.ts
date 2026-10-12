import { unique } from "../../helpers/array";
import { logger } from "../../helpers/debug";
import localSettings from "../preferences";

const log = logger.extend("napplet-shell-relay-tiers");

export function getReadRelays() {
  const relays = localSettings.fallbackRelays.value;
  log("read relays", relays);
  return relays;
}

export function getWriteRelays() {
  const relays = unique([...localSettings.extraPublishRelays.value, ...localSettings.fallbackRelays.value]);
  log("write relays", relays);
  return relays;
}
