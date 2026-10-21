// aislop-ignore-file code-quality/duplicate-block -- torrentCatagories is a static taxonomy; repeated {name,tag} entries are independent data, not extractable code
import {
  buildTorrentMagnetLink,
  getTorrentFiles,
  getTorrentInfoHash,
  getTorrentTitle,
  getTorrentTrackers,
} from "applesauce-common/helpers";
import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

export const TORRENT_KIND = 2003;

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

// Older events used a "btih" tag before NIP-35 settled on "x"
function getInfoHash(torrent: NostrEvent) {
  return getTorrentInfoHash(torrent) ?? getTagValue(torrent, "btih");
}

export function getTorrentSize(torrent: NostrEvent) {
  return getTorrentFiles(torrent).reduce((acc, f) => acc + (f.size ?? 0), 0);
}

export function getTorrentMagnetLink(torrent: NostrEvent) {
  const infoHash = getInfoHash(torrent);
  if (!infoHash) return undefined;
  const trackers = getTorrentTrackers(torrent);
  return buildTorrentMagnetLink(infoHash, trackers.length > 0 ? trackers : Trackers, getTorrentTitle(torrent));
}

export function validateTorrent(torrent: NostrEvent) {
  return !!getTorrentTitle(torrent) && !!getInfoHash(torrent);
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
