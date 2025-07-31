import { lazy } from "react";
import { Outlet, RouteObject } from "react-router-dom";
import useParamsProfilePointer from "../../hooks/use-params-pubkey-pointer";
import UserAboutView from "./about";
import UserArticlesTab from "./tabs/articles";
import UserPicturePostsTab from "./tabs/media";
import UserNotesTab from "./tabs/notes";

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
const UserRelaysTab = lazy(() => import("./tabs/relays"));
const UserReportsTab = lazy(() => import("./tabs/reports"));
const UserMutedByTab = lazy(() => import("./tabs/muted-by"));
const UserMessagesTab = lazy(() => import("./tabs/messages"));
const UserTorrentsTab = lazy(() => import("./tabs/torrents"));

function UserViewProvider() {
  const user = useParamsProfilePointer("pubkey");
  return <Outlet context={{ pubkey: user.pubkey, user }} />;
}

export default [
  {
    Component: UserViewProvider,
    children: [
      { index: true, Component: UserAboutView },

      { path: "notes", Component: UserNotesTab },
      { path: "articles", Component: UserArticlesTab },
      { path: "media", Component: UserPicturePostsTab },
      { path: "streams", Component: UserStreamsTab },
      { path: "videos", Component: UserVideosTab },
      { path: "files", Component: UserFilesTab },
      { path: "zaps", Component: UserZapsTab },
      { path: "reactions", Component: UserReactionsTab },
      { path: "lists", Component: UserListsTab },
      { path: "followers", Component: UserFollowersTab },
      { path: "following", Component: UserFollowingTab },
      { path: "goals", Component: UserGoalsTab },
      { path: "emojis", Component: UserEmojiPacksTab },
      { path: "relays", Component: UserRelaysTab },
      { path: "reports", Component: UserReportsTab },
      { path: "muted-by", Component: UserMutedByTab },
      { path: "dms", Component: UserMessagesTab },
      { path: "torrents", Component: UserTorrentsTab },
    ],
  },
] satisfies RouteObject[];
