import { lazy } from "react";
import { Outlet, RouteObject } from "react-router-dom";

import {
  AddReactionIcon,
  ArticleIcon,
  DownloadIcon,
  EmojiPacksIcon,
  ErrorIcon,
  FollowIcon,
  GoalIcon,
  LightningIcon,
  ListsIcon,
  LiveStreamIcon,
  MediaIcon,
  MuteIcon,
  NotesIcon,
  ProfileIcon,
  RelayIcon,
  SettingsIcon,
  TorrentIcon,
  VideoIcon,
} from "../../components/icons";
import AppTabsLayout, { AppTabs, AppTabsProvider } from "../../components/layout/presets/app-tabs-layout";
import useParamsProfilePointer from "../../hooks/use-params-pubkey-pointer";
import UserAboutView from "./about";
import UserArticlesTab from "./tabs/articles";
import UserPicturePostsTab from "./tabs/media";
import UserNotesTab from "./tabs/notes";
import UserPlus01 from "../../components/icons/user-plus-01";
import SimpleHeader from "../../components/layout/components/simple-header";
import { Flex } from "@chakra-ui/react";
import UserLink from "../../components/user/user-link";
import UserAvatar from "../../components/user/user-avatar";

// other stuff
const UserStreamsTab = lazy(() => import("./tabs/streams"));
const UserFilesTab = lazy(() => import("./tabs/files"));
const UserVideosTab = lazy(() => import("./tabs/videos"));
const UserZapsTab = lazy(() => import("./tabs/zaps"));
const UserReactionsTab = lazy(() => import("./tabs/reactions"));
const UserListsTab = lazy(() => import("./tabs/lists"));
const UserFollowersTab = lazy(() => import("./tabs/followers"));
const UserFollowingTab = lazy(() => import("./tabs/following"));
const UserGoalsTab = lazy(() => import("./tabs/goals"));
const UserEmojiPacksTab = lazy(() => import("./tabs/emoji-packs"));
const UserReportsTab = lazy(() => import("./tabs/reports"));
const UserMutedByTab = lazy(() => import("./tabs/muted-by"));
const UserMessagesTab = lazy(() => import("./tabs/messages"));
const UserTorrentsTab = lazy(() => import("./tabs/torrents"));
const UserAdvancedTab = lazy(() => import("./tabs/advanced"));

export const userProfileTabs: AppTabs[] = [
  { label: "About", path: "", icon: ProfileIcon },
  { label: "Notes", path: "notes", icon: NotesIcon, Component: UserNotesTab },
  { label: "Articles", path: "articles", icon: ArticleIcon, Component: UserArticlesTab },
  { label: "Streams", path: "streams", icon: LiveStreamIcon, Component: UserStreamsTab },
  { label: "Media", path: "media", icon: MediaIcon, Component: UserPicturePostsTab },
  { label: "Zaps", path: "zaps", icon: LightningIcon, Component: UserZapsTab },
  { label: "Lists", path: "lists", icon: ListsIcon, Component: UserListsTab },
  { label: "Following", path: "following", icon: FollowIcon, Component: UserFollowingTab },
  { label: "Reactions", path: "reactions", icon: AddReactionIcon, Component: UserReactionsTab },
  { label: "Goals", path: "goals", icon: GoalIcon, Component: UserGoalsTab },
  { label: "Videos", path: "videos", icon: VideoIcon, Component: UserVideosTab },
  { label: "Files", path: "files", icon: DownloadIcon, Component: UserFilesTab },
  { label: "Emojis", path: "emojis", icon: EmojiPacksIcon, Component: UserEmojiPacksTab },
  { label: "Torrents", path: "torrents", icon: TorrentIcon, Component: UserTorrentsTab },
  { label: "Reports", path: "reports", icon: ErrorIcon, Component: UserReportsTab },
  { label: "Followers", path: "followers", icon: UserPlus01, Component: UserFollowersTab },
  { label: "Muted by", path: "muted-by", icon: MuteIcon, Component: UserMutedByTab },
  { label: "Advanced", path: "advanced", icon: SettingsIcon, Component: UserAdvancedTab },
];

function UserViewHeader() {
  const user = useParamsProfilePointer("pubkey");

  return (
    <SimpleHeader
      title={
        <Flex alignItems="center" gap="2">
          <UserLink pubkey={user.pubkey} />
        </Flex>
      }
      icon={<UserAvatar pubkey={user.pubkey} size="sm" />}
    />
  );
}

export default [
  {
    index: true,
    element: (
      <AppTabsProvider tabs={userProfileTabs}>
        <UserAboutView />
      </AppTabsProvider>
    ),
  },
  {
    element: (
      <AppTabsLayout tabs={userProfileTabs} header={<UserViewHeader />}>
        <Outlet />
      </AppTabsLayout>
    ),
    children: userProfileTabs,
  },
] satisfies RouteObject[];
