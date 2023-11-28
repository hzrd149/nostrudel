import { NostrEvent } from "../../types/nostr-event";

export const TORRENT_KIND = 2003;
export const TORRENT_COMMENT_KIND = 2004;

export const Trackers = [
  "udp://tracker.coppersurfer.tk:6969/announce",
  "udp://tracker.openbittorrent.com:6969/announce",
  "udp://open.stealth.si:80/announce",
  "udp://tracker.torrent.eu.org:451/announce",
  "udp://tracker.opentrackr.org:1337",
  "udp://tracker.leechers-paradise.org:6969",
  "udp://tracker.coppersurfer.tk:6969",
  "udp://tracker.opentrackr.org:1337",
  "udp://explodie.org:6969",
  "udp://tracker.empire-js.us:1337",
  "wss://tracker.btorrent.xyz",
  "wss://tracker.openwebtorrent.com",
  ":wss://tracker.fastcast.nze",
];

export function getTorrentTitle(torrent: NostrEvent) {
  const title = torrent.tags.find((t) => t[0] === "title")?.[1];
  if (!title) throw new Error("Missing title");
  return title;
}
export function getTorrentBtih(torrent: NostrEvent) {
  const btih = torrent.tags.find((a) => a[0] === "btih")?.[1];
  if (!btih) throw new Error("Missing btih");
  return btih;
}
export function getTorrentFiles(torrent: NostrEvent) {
  return torrent.tags
    .filter((t) => t[0] === "file")
    .map((t) => {
      const name = t[1] as string;
      const size = t[2] ? parseInt(t[2]) : undefined;
      return { name, size };
    });
}
export function getTorrentSize(torrent: NostrEvent) {
  return getTorrentFiles(torrent).reduce((acc, f) => (f.size ? (acc += f.size) : acc), 0);
}

export function getTorrentMagnetLink(torrent: NostrEvent) {
  const btih = getTorrentBtih(torrent);
  const magnet = {
    xt: `urn:btih:${btih}`,
    dn: name,
    tr: Trackers,
  };
  const params = Object.entries(magnet)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        return v.map((a) => `${k}=${encodeURIComponent(a)}`).join("&");
      } else {
        return `${k}=${v as string}`;
      }
    })
    .flat()
    .join("&");
  return `magnet:?${params}`;
}

export function validateTorrent(torrent: NostrEvent) {
  try {
    getTorrentTitle(torrent);
    getTorrentBtih(torrent);
    return true;
  } catch (e) {
    return false;
  }
}
