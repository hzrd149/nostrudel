import {
  BadgeIcon,
  BookmarkIcon,
  ChannelsIcon,
  CommunityIcon,
  DirectMessagesIcon,
  EmojiPacksIcon,
  GoalIcon,
  ListsIcon,
  LiveStreamIcon,
  MapIcon,
  MuteIcon,
  SearchIcon,
  TorrentIcon,
  TrackIcon,
  WikiIcon,
} from "../../components/icons";
import { App } from "./component/app-card";
import ShieldOff from "../../components/icons/shield-off";
import Film02 from "../../components/icons/film-02";
import MessageQuestionSquare from "../../components/icons/message-question-square";
import UploadCloud01 from "../../components/icons/upload-cloud-01";
import Edit04 from "../../components/icons/edit-04";

export const internalApps: App[] = [
  {
    title: "Streams",
    description: "Watch live streams",
    icon: LiveStreamIcon,
    id: "streams",
    to: "/streams",
  },
  {
    title: "Communities",
    description: "Create and manage communities",
    icon: CommunityIcon,
    id: "communities",
    to: "/communities",
  },
  { title: "Wiki", description: "Browse wiki pages", icon: WikiIcon, id: "wiki", to: "/wiki" },
  {
    title: "Channels",
    description: "Browse and talk in channels",
    icon: ChannelsIcon,
    id: "channels",
    to: "/channels",
  },
  { title: "Badges", description: "Create and manage badges", icon: BadgeIcon, id: "badges", to: "/badges" },
  { title: "Goals", description: "Browse and create goals", icon: GoalIcon, id: "goals", to: "/goals" },
  { title: "Torrents", description: "Browse torrents on nostr", icon: TorrentIcon, id: "torrents", to: "/torrents" },
  { title: "Emojis", description: "Create custom emoji packs", icon: EmojiPacksIcon, id: "emojis", to: "/emojis" },
  { title: "Bookmarks", description: "Manage your bookmarks", icon: BookmarkIcon, id: "bookmarks", to: "/bookmarks" },
  { title: "Lists", description: "Browse and create lists", icon: ListsIcon, id: "lists", to: "/lists" },
  { title: "Tracks", description: "Browse stemstr tracks", icon: TrackIcon, id: "tracks", to: "/tracks" },
  { title: "Videos", description: "Browse flare videos", icon: Film02, id: "videos", to: "/videos" },
  { title: "Articles", description: "Browse articles", icon: Edit04, id: "articles", to: "/articles" },
];

export const internalTools: App[] = [
  {
    title: "Event Console",
    description: "Find events based on nostr filters",
    icon: SearchIcon,
    id: "console",
    to: "/tools/console",
  },
  {
    title: "Event Publisher",
    description: "Write and publish events",
    icon: UploadCloud01,
    id: "publisher",
    to: "/tools/publisher ",
  },
  {
    title: "Unknown Events",
    description: "A timeline of unknown events",
    icon: MessageQuestionSquare,
    id: "unknown",
    to: "/tools/unknown",
  },
  {
    title: "Satellite CDN",
    description: "Scalable media hosting for the nostr ecosystem",
    image: "https://satellite.earth/image.png",
    id: "satellite-cdn",
    to: "/tools/satellite-cdn",
  },
  { title: "Map", description: "Explore events with geohashes", icon: MapIcon, id: "map", to: "/map" },
  {
    title: "Stream Moderation",
    description: "A dashboard for moderating streams",
    icon: LiveStreamIcon,
    id: "stream-moderation",
    to: "/streams/moderation",
  },
  {
    title: "Mute Graph",
    description: "See who in your contacts has muted each other",
    icon: MuteIcon,
    id: "network-mute-graph",
    to: "/tools/network-mute-graph",
  },
  {
    title: "DM Graph",
    description: "See who in your contacts is talking",
    icon: DirectMessagesIcon,
    id: "network-dm-graph",
    to: "/tools/network-dm-graph",
  },
  {
    title: "DM Timeline",
    description: "A timeline of everyone DMs",
    icon: ShieldOff,
    id: "dm-timeline",
    to: "/tools/dm-timeline",
  },
  {
    title: "Corrections Feed",
    description: "A feed of post edits",
    icon: Edit04,
    id: "corrections",
    to: "/tools/corrections ",
  },
];

export const externalTools: App[] = [
  {
    id: "nak",
    title: "Nostr Army Knife",
    description: "Universal NIP-19 tool",
    to: "https://nak.nostr.com/",
    image: "https://nak.nostr.com/favicon.ico",
    isExternal: true,
  },
  {
    id: "nostrdebug.co",
    title: "Nostr Debug",
    description: "Debug nostr relays and sign events",
    to: "https://nostrdebug.com/",
    image: "https://nostrdebug.com/favicon.ico",
    isExternal: true,
  },
  {
    id: "dtan.xyz",
    title: "DTAN",
    description: "Torrents over nostr",
    to: "https://dtan.xyz/",
    image: "https://dtan.xyz/logo_256.jpg",
    isExternal: true,
  },
  {
    id: "nostrapps.com",
    title: "Nostr Apps",
    description: "Curated directory of nostr apps",
    image: "https://uploads-ssl.webflow.com/641d0d46d5c124ac928a6027/64b1dd06d59d8f1e530d2926_32x32.png",
    to: "https://www.nostrapps.com/",
    isExternal: true,
  },
  {
    id: "metadata.nostr.com",
    title: "Nostr Profile Manager",
    description: "Backup and manage your profile",
    to: "https://metadata.nostr.com/",
    image: "https://metadata.nostr.com/img/git.png",
    isExternal: true,
  },
  {
    id: "nostr-delete.vercel.app",
    title: "Nostr Event Deletion",
    description: "Advanced event deletion",
    to: "https://nostr-delete.vercel.app/",
    image: "https://nostr-delete.vercel.app/favicon.png",
    isExternal: true,
  },
  {
    id: "w3.do",
    title: "URL Shortener",
    description: "Shorten URLs and store on nostr",
    to: "https://w3.do/",
    image: "https://w3.do/favicon.ico",
    isExternal: true,
  },
  {
    id: "nosbin.com",
    title: "nosbin",
    description: "Upload code snippets to nostr",
    to: "https://nosbin.com/",
    image: "https://nosbin.com/logo.png",
    isExternal: true,
  },
  {
    id: "blossom.hzrd149.com",
    title: "Blossom Drive",
    description: "Upload and organize blobs",
    to: "https://blossom.hzrd149.com/",
    image: "https://blossom.hzrd149.com/pwa-192x192.png",
    isExternal: true,
  },
  {
    id: "bouquet.slidestr.net",
    title: "Bouquet",
    description: "Manage your blobs on multiple servers",
    to: "https://bouquet.slidestr.net/",
    image: "https://bouquet.slidestr.net/bouquet.png",
    isExternal: true,
  },
];

export const allApps = [...internalApps, ...internalTools, ...externalTools];
