import { ComponentWithAs, IconProps } from "@chakra-ui/react";

import {
  ArticleIcon,
  BadgeIcon,
  BookmarkIcon,
  ChannelsIcon,
  DirectMessagesIcon,
  EmojiPacksIcon,
  GoalIcon,
  ListsIcon,
  LiveStreamIcon,
  MapIcon,
  MediaIcon,
  MuteIcon,
  NotesIcon,
  NotificationsIcon,
  SearchIcon,
  TorrentIcon,
  TrackIcon,
  VideoIcon,
  WikiIcon,
} from "../icons";
import ShieldOff from "../icons/shield-off";
import MessageQuestionSquare from "../icons/message-question-square";
import UploadCloud01 from "../icons/upload-cloud-01";
import Edit04 from "../icons/edit-04";
import Users03 from "../icons/users-03";
import FileAttachment01 from "../icons/file-attachment-01";
import Rocket02 from "../icons/rocket-02";
import PuzzlePiece01 from "../icons/puzzle-piece-01";
import Users02 from "../icons/users-02";
import Wallet02 from "../icons/wallet-02";
import Users01 from "../icons/users-01";
import MessageChatCircle from "../icons/message-chat-circle";

export type App = {
  icon?: ComponentWithAs<"svg", IconProps>;
  image?: string;
  title: string;
  description: string;
  id: string;
  isExternal?: boolean;
  to: string;
};

export const internalApps: App[] = [
  { title: "Notes", description: "Short text posts from your friends", icon: NotesIcon, id: "notes", to: "/notes" },
  { title: "Launchpad", description: "Quick account overview", icon: Rocket02, id: "launchpad", to: "/launchpad" },
  { title: "Discover", description: "Discover new feeds", icon: PuzzlePiece01, id: "discover", to: "/discovery" },
  {
    title: "Notifications",
    description: "Notifications feed",
    icon: NotificationsIcon,
    id: "notifications",
    to: "/notifications",
  },
  {
    title: "Messages",
    description: "Direct Messages",
    icon: DirectMessagesIcon,
    id: "messages",
    to: "/messages",
  },
  { title: "Search", description: "Search for users and notes", icon: SearchIcon, id: "search", to: "/search" },
  {
    title: "Streams",
    description: "Watch live streams",
    icon: LiveStreamIcon,
    id: "streams",
    to: "/streams",
  },
  {
    title: "Groups",
    description: "Simple relay based groups",
    icon: Users02,
    id: "groups",
    to: "/groups",
  },
  {
    title: "Relay Chat",
    description: "Simple dissapearing chat on relays",
    icon: MessageChatCircle,
    id: "relay-chat",
    to: "/relay-chat",
  },
  {
    title: "Pictures",
    description: "Browser picture posts",
    icon: MediaIcon,
    id: "pictures",
    to: "/pictures",
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
  {
    title: "Lists",
    description: "Lists of people and notes",
    icon: Users01,
    id: "lists",
    to: "/lists",
  },
  { title: "Tracks", description: "Browse stemstr tracks", icon: TrackIcon, id: "tracks", to: "/tracks" },
  { title: "Videos", description: "Browse videos", icon: VideoIcon, id: "videos", to: "/videos" },
  { title: "Articles", description: "Browse articles", icon: ArticleIcon, id: "articles", to: "/articles" },
  { title: "Files", description: "Browse files", icon: FileAttachment01, id: "files", to: "/files" },
  { title: "Wallet", description: "Receive and send cashu tokens", icon: Wallet02, id: "wallet", to: "/wallet" },
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
    to: "/tools/publisher",
  },
  {
    title: "Unknown Events",
    description: "A timeline of unknown events",
    icon: MessageQuestionSquare,
    id: "unknown",
    to: "/tools/unknown",
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
    to: "/tools/corrections",
  },
  {
    title: "noStrudel Users",
    description: "Discover other users using noStrudel",
    icon: Users03,
    id: "nostrudel-users",
    to: "/tools/nostrudel-users",
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
    title: "Satellite CDN",
    description: "Scalable media hosting for the nostr ecosystem",
    image: "https://satellite.earth/image.png",
    id: "satellite-cdn",
    to: "https://satellite.earth/cdn",
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
    id: "bouquet.slidestr.net",
    title: "Bouquet",
    description: "Manage your blobs on multiple servers",
    to: "https://bouquet.slidestr.net/",
    image: "https://bouquet.slidestr.net/bouquet.png",
    isExternal: true,
  },
];

export const defaultAnonFavoriteApps = ["notes", "discover", "search", "articles", "streams"];
export const defaultUserFavoriteApps = ["launchpad", "notes", "discover", "notifications", "messages", "search"];

export const allApps = [...internalApps, ...internalTools, ...externalTools];
