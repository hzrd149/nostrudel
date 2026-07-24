import { ComponentWithAs, IconProps } from "@chakra-ui/react";

import {
  ArticleIcon,
  BookmarkIcon,
  ChannelsIcon,
  DirectMessagesIcon,
  EmojiPacksIcon,
  LiveStreamIcon,
  MediaIcon,
  NotesIcon,
  NotificationsIcon,
  SearchIcon,
  TorrentIcon,
  VideoIcon,
} from "../icons";
import BarChart09 from "../icons/bar-chart-09";
import FileAttachment01 from "../icons/file-attachment-01";
import GamingPad01 from "../icons/gaming-pad-01";
import PuzzlePiece01 from "../icons/puzzle-piece-01";
import UploadCloud01 from "../icons/upload-cloud-01";
import Users01 from "../icons/users-01";
import Users02 from "../icons/users-02";
import Wallet02 from "../icons/wallet-02";
import Globe01 from "../icons/globe-01";

export type App = {
  icon?: ComponentWithAs<"svg", IconProps>;
  image?: string;
  title: string;
  description: string;
  id: string;
  to: string;
};

export const internalApps: App[] = [
  { title: "Notes", description: "Short text posts from your friends", icon: NotesIcon, id: "notes", to: "/notes" },
  { title: "Feeds", description: "Discover new feeds", icon: PuzzlePiece01, id: "feeds", to: "/feeds" },
  { title: "Store", description: "Discover and manage NIP-5D apps", icon: PuzzlePiece01, id: "napplets", to: "/app/store" },
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
    title: "Pictures",
    description: "Browser picture posts",
    icon: MediaIcon,
    id: "pictures",
    to: "/pictures",
  },
  {
    title: "Channels",
    description: "Browse and talk in channels",
    icon: ChannelsIcon,
    id: "channels",
    to: "/channels",
  },
  { title: "Torrents", description: "Browse torrents on nostr", icon: TorrentIcon, id: "torrents", to: "/torrents" },
  { title: "Webxdc", description: "Play webxdc apps over nostr", icon: GamingPad01, id: "webxdc", to: "/webxdc" },
  { title: "Emojis", description: "Create custom emoji packs", icon: EmojiPacksIcon, id: "emojis", to: "/emojis" },
  { title: "Bookmarks", description: "Manage your bookmarks", icon: BookmarkIcon, id: "bookmarks", to: "/bookmarks" },
  {
    title: "Lists",
    description: "Lists of people and notes",
    icon: Users01,
    id: "lists",
    to: "/lists",
  },
  { title: "Articles", description: "Browse articles", icon: ArticleIcon, id: "articles", to: "/articles" },
  { title: "Polls", description: "Vote on polls from your contacts", icon: BarChart09, id: "polls", to: "/polls" },
  { title: "Files", description: "Browse files", icon: FileAttachment01, id: "files", to: "/files" },
  { title: "Wallet", description: "Receive and send cashu tokens", icon: Wallet02, id: "wallet", to: "/wallet" },
  { title: "Relay map", description: "Discover relays on a map", icon: Globe01, id: "relay-map", to: "/relays/map" },
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
    title: "Stream Moderation",
    description: "A dashboard for moderating streams",
    icon: LiveStreamIcon,
    id: "stream-moderation",
    to: "/streams/moderation",
  },
];

export const defaultAnonFavoriteApps = ["notes", "discover", "search", "articles", "streams"];
export const defaultUserFavoriteApps = ["notes", "discover", "notifications", "messages", "search"];

export const allApps = [...internalApps, ...internalTools];
