import RelaySet from "../classes/relay-set";
import { safeRelayUrls } from "./relay";

export async function getRelaysFromExt() {
  if (!window.nostr) throw new Error("Missing extension");
  const read = new RelaySet();
  const write = new RelaySet();
  const extRelays = (await window.nostr.getRelays?.()) ?? [];
  if (Array.isArray(extRelays)) {
    const safeUrls = safeRelayUrls(extRelays);
    read.merge(safeUrls);
    write.merge(safeUrls);
  } else {
    read.merge(safeRelayUrls(Object.keys(extRelays).filter((url) => extRelays[url].read)));
    write.merge(safeRelayUrls(Object.keys(extRelays).filter((url) => extRelays[url].write)));
  }

  return { read, write };
}
