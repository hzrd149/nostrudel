import { normalizeURL } from "applesauce-core/helpers";

export async function getRelaysFromExt() {
  if (!window.nostr) throw new Error("Missing extension");
  const read = new Set<string>();
  const write = new Set<string>();
  const extRelays = (await window.nostr.getRelays?.()) ?? ([] as string[]);
  if (Array.isArray(extRelays)) {
    for (const url of extRelays) {
      read.add(url);
      write.add(url);
    }
  } else {
    const readUrls = Object.keys(extRelays)
      .filter((url) => extRelays[url].read)
      .map(normalizeURL);
    for (const url of readUrls) read.add(url);

    const writeUrls = Object.keys(extRelays)
      .filter((url) => extRelays[url].write)
      .map(normalizeURL);
    for (const url of writeUrls) write.add(url);
  }

  return { read, write };
}
