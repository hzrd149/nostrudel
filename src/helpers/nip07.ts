import { safeRelayUrls } from "applesauce-core/helpers";

export async function getRelaysFromExt() {
  if (!window.nostr) throw new Error("Missing extension");
  const read = new Set<string>();
  const write = new Set<string>();
  const extRelays = (await window.nostr.getRelays?.()) ?? [];
  if (Array.isArray(extRelays)) {
    const safeUrls = safeRelayUrls(extRelays);
    for (const url of safeUrls) {
      read.add(url);
      write.add(url);
    }
  } else {
    const readUrls = safeRelayUrls(Object.keys(extRelays).filter((url) => extRelays[url].read));
    for (const url of readUrls) read.add(url);

    const writeUrls = safeRelayUrls(Object.keys(extRelays).filter((url) => extRelays[url].write));
    for (const url of writeUrls) write.add(url);
  }

  return { read, write };
}
