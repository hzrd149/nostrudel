import { NostrEvent } from "nostr-tools";

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
];

export function getTorrentTitle(torrent: NostrEvent) {
  const title = torrent.tags.find((t) => t[0] === "title")?.[1];
  if (!title) throw new Error("Missing title");
  return title;
}
export function getTorrentBtih(torrent: NostrEvent) {
  const btih = torrent.tags.find((a) => a[0] === "btih" || a[0] === "x")?.[1];
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

export type Category = {
  name: string;
  tag: string;
  sub_category?: Category[];
};

export const torrentCatagories: Category[] = [
  {
    name: "Video",
    tag: "video",
    sub_category: [
      {
        name: "Movies",
        tag: "movie",
        sub_category: [
          { name: "Movies DVDR", tag: "dvdr" },
          { name: "HD Movies", tag: "hd" },
          { name: "4k Movies", tag: "4k" },
        ],
      },
      {
        name: "TV",
        tag: "tv",
        sub_category: [
          { name: "HD TV", tag: "hd" },
          { name: "4k TV", tag: "4k" },
        ],
      },
    ],
  },
  {
    name: "Audio",
    tag: "audio",
    sub_category: [
      {
        name: "Music",
        tag: "music",
        sub_category: [{ name: "FLAC", tag: "flac" }],
      },
      { name: "Audio Books", tag: "audio-book" },
    ],
  },
  {
    name: "Applications",
    tag: "application",
    sub_category: [
      { name: "Windows", tag: "windows" },
      { name: "Mac", tag: "mac" },
      { name: "UNIX", tag: "unix" },
      { name: "iOS", tag: "ios" },
      { name: "Android", tag: "android" },
    ],
  },
  {
    name: "Games",
    tag: "game",
    sub_category: [
      { name: "PC", tag: "pc" },
      { name: "Mac", tag: "mac" },
      { name: "PSx", tag: "psx" },
      { name: "XBOX", tag: "xbox" },
      { name: "Wii", tag: "wii" },
      { name: "iOS", tag: "ios" },
      { name: "Android", tag: "android" },
    ],
  },
  {
    name: "Porn",
    tag: "porn",
    sub_category: [
      {
        name: "Movies",
        tag: "movie",
        sub_category: [
          { name: "Movies DVDR", tag: "dvdr" },
          { name: "HD Movies", tag: "hd" },
          { name: "4k Movies", tag: "4k" },
        ],
      },
      { name: "Pictures", tag: "picture" },
      { name: "Games", tag: "game" },
    ],
  },
  {
    name: "Other",
    tag: "other",
    sub_category: [
      { name: "Archives", tag: "archive" },
      { name: "E-Books", tag: "e-book" },
      { name: "Comics", tag: "comic" },
      { name: "Pictures", tag: "picture" },
    ],
  },
];
