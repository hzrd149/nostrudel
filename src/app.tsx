import { lazy, Suspense } from "react";
import { createHashRouter, Outlet, RouterProvider, ScrollRestoration } from "react-router-dom";
import { Spinner } from "@chakra-ui/react";
import { css, Global } from "@emotion/react";

import { ErrorBoundary } from "./components/error-boundary";
import Layout from "./components/layout";
import DrawerSubViewProvider from "./providers/drawer-sub-view-provider";
import useSetColorMode from "./hooks/use-set-color-mode";

import HomeView from "./views/home/index";
import DVMFeedHomeView from "./views/dvm-feed/index";
import SettingsView from "./views/settings";
import NostrLinkView from "./views/link";
import ProfileView from "./views/profile";
import HashTagView from "./views/hashtag";
import ThreadView from "./views/thread";
import NotificationsView from "./views/notifications";
import DirectMessagesView from "./views/dms";
import DirectMessageChatView from "./views/dms/chat";

import SigninView from "./views/signin";
import SignupView from "./views/signup";
import LoginStartView from "./views/signin/start";
import LoginNpubView from "./views/signin/npub";
import LoginNip05View from "./views/signin/nip05";
import LoginNsecView from "./views/signin/nsec";

import UserView from "./views/user";
import UserNotesTab from "./views/user/notes";
import UserFollowersTab from "./views/user/followers";
import UserRelaysTab from "./views/user/relays";
import UserFollowingTab from "./views/user/following";
import UserZapsTab from "./views/user/zaps";
import UserReportsTab from "./views/user/reports";
import UserAboutTab from "./views/user/about";
import UserReactionsTab from "./views/user/reactions";
import UserListsTab from "./views/user/lists";
import UserGoalsTab from "./views/user/goals";
import MutedByView from "./views/user/muted-by";
import UserArticlesTab from "./views/user/articles";
const UserTorrentsTab = lazy(() => import("./views/user/torrents"));

import ListsHomeView from "./views/lists";
import ListView from "./views/lists/list";
import BrowseListView from "./views/lists/browse";

import EmojiPacksBrowseView from "./views/emoji-packs/browse";
import EmojiPackView from "./views/emoji-packs/emoji-pack";
import UserEmojiPacksTab from "./views/user/emoji-packs";
import EmojiPacksView from "./views/emoji-packs";

import GoalsView from "./views/goals";
import GoalsBrowseView from "./views/goals/browse";
import GoalDetailsView from "./views/goals/goal-details";

import BadgesView from "./views/badges";
import BadgesBrowseView from "./views/badges/browse";
import BadgeDetailsView from "./views/badges/badge-details";

import CommunitiesHomeView from "./views/communities";
import CommunitiesExploreView from "./views/communities/explore";
import CommunityFindByNameView from "./views/community/find-by-name";
import CommunityView from "./views/community/index";
import CommunityPendingView from "./views/community/views/pending";
import CommunityNewestView from "./views/community/views/newest";
import CommunityTrendingView from "./views/community/views/trending";

import RelaysView from "./views/relays";
import RelayView from "./views/relays/relay";
import RelayReviewsView from "./views/relays/reviews";
import PopularRelaysView from "./views/relays/popular";
import UserDMsTab from "./views/user/dms";
import DMTimelineView from "./views/tools/dm-timeline";
import LoginNostrConnectView from "./views/signin/nostr-connect";
import ThreadsNotificationsView from "./views/notifications/threads";
import DVMFeedView from "./views/dvm-feed/feed";
import TransformNoteView from "./views/tools/transform-note";
import SatelliteCDNView from "./views/tools/satellite-cdn";
import OtherStuffView from "./views/other-stuff";
import { RouteProviders } from "./providers/route";
import LaunchpadView from "./views/launchpad";
import TracksView from "./views/tracks";
import VideosView from "./views/videos";
import VideoDetailsView from "./views/videos/video";
import BookmarksView from "./views/bookmarks";
const UserTracksTab = lazy(() => import("./views/user/tracks"));
const UserVideosTab = lazy(() => import("./views/user/videos"));

const ToolsHomeView = lazy(() => import("./views/tools"));
const WotTestView = lazy(() => import("./views/tools/wot-test"));
const StreamModerationView = lazy(() => import("./views/streams/dashboard"));
const NetworkMuteGraphView = lazy(() => import("./views/tools/network-mute-graph"));
const NetworkDMGraphView = lazy(() => import("./views/tools/network-dm-graph"));
const UnknownTimelineView = lazy(() => import("./views/tools/unknown-event-feed"));

const UserStreamsTab = lazy(() => import("./views/user/streams"));
const StreamsView = lazy(() => import("./views/streams"));
const StreamView = lazy(() => import("./views/streams/stream"));

const SearchView = lazy(() => import("./views/search"));
const MapView = lazy(() => import("./views/map"));

const ThingsView = lazy(() => import("./views/things/index"));
const ThingUploadView = lazy(() => import("./views/things/upload"));

const ChannelsHomeView = lazy(() => import("./views/channels"));
const ChannelView = lazy(() => import("./views/channels/channel"));

const TorrentsView = lazy(() => import("./views/torrents"));
const TorrentDetailsView = lazy(() => import("./views/torrents/torrent"));
const NewTorrentView = lazy(() => import("./views/torrents/new"));

const overrideReactTextareaAutocompleteStyles = css`
  .rta__autocomplete {
    z-index: var(--chakra-zIndices-popover);
    font-size: var(--chakra-fontSizes-md);
  }
  .rta__list {
    background: var(--chakra-colors-chakra-subtle-bg);
    color: var(--chakra-colors-chakra-body-text);
    border: var(--chakra-borders-1px) var(--chakra-colors-chakra-border-color);
    border-radius: var(--chakra-sizes-1);
    overflow: hidden;
  }
  .rta__entity {
    background: none;
    color: inherit;
    padding: var(--chakra-sizes-1) var(--chakra-sizes-2);
  }
  .rta__entity--selected {
    background: var(--chakra-ring-color);
  }
  .rta__item:not(:last-child) {
    border-bottom: var(--chakra-borders-1px) var(--chakra-colors-chakra-border-color);
  }
`;

const RootPage = () => {
  useSetColorMode();

  return (
    <RouteProviders>
      <Layout>
        <ScrollRestoration />
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </Layout>
    </RouteProviders>
  );
};
const NoLayoutPage = () => {
  return (
    <RouteProviders>
      <ScrollRestoration />
      <Suspense fallback={<Spinner />}>
        <Outlet />
      </Suspense>
    </RouteProviders>
  );
};

const router = createHashRouter([
  {
    path: "signin",
    element: <SigninView />,
    children: [
      { path: "", element: <LoginStartView /> },
      { path: "npub", element: <LoginNpubView /> },
      { path: "nip05", element: <LoginNip05View /> },
      { path: "nsec", element: <LoginNsecView /> },
      { path: "nostr-connect", element: <LoginNostrConnectView /> },
    ],
  },
  {
    path: "signup",
    element: <NoLayoutPage />,
    children: [
      {
        path: "",
        element: <SignupView />,
      },
      {
        path: ":step",
        element: <SignupView />,
      },
    ],
  },
  {
    path: "streams/moderation",
    element: (
      <RouteProviders>
        <StreamModerationView />
      </RouteProviders>
    ),
  },
  {
    path: "streams/:naddr",
    element: (
      <RouteProviders>
        <StreamView />
      </RouteProviders>
    ),
  },
  {
    path: "map",
    element: <MapView />,
  },
  {
    path: "launchpad",
    element: (
      <RouteProviders>
        <LaunchpadView />
      </RouteProviders>
    ),
  },
  {
    path: "/",
    element: <RootPage />,
    children: [
      {
        path: "/u/:pubkey",
        element: <UserView />,
        children: [
          { path: "", element: <UserAboutTab /> },
          { path: "about", element: <UserAboutTab /> },
          { path: "notes", element: <UserNotesTab /> },
          { path: "articles", element: <UserArticlesTab /> },
          { path: "streams", element: <UserStreamsTab /> },
          { path: "tracks", element: <UserTracksTab /> },
          { path: "videos", element: <UserVideosTab /> },
          { path: "zaps", element: <UserZapsTab /> },
          { path: "likes", element: <UserReactionsTab /> },
          { path: "lists", element: <UserListsTab /> },
          { path: "followers", element: <UserFollowersTab /> },
          { path: "following", element: <UserFollowingTab /> },
          { path: "goals", element: <UserGoalsTab /> },
          { path: "emojis", element: <UserEmojiPacksTab /> },
          { path: "relays", element: <UserRelaysTab /> },
          { path: "reports", element: <UserReportsTab /> },
          { path: "muted-by", element: <MutedByView /> },
          { path: "dms", element: <UserDMsTab /> },
          { path: "torrents", element: <UserTorrentsTab /> },
        ],
      },
      {
        path: "/n/:id",
        element: <ThreadView />,
      },
      { path: "other-stuff", element: <OtherStuffView /> },
      { path: "settings", element: <SettingsView /> },
      {
        path: "relays",
        children: [
          { path: "", element: <RelaysView /> },
          { path: "popular", element: <PopularRelaysView /> },
          { path: "reviews", element: <RelayReviewsView /> },
        ],
      },
      { path: "r/:relay", element: <RelayView /> },
      {
        path: "notifications",
        children: [
          { path: "threads", element: <ThreadsNotificationsView /> },
          { path: "", element: <NotificationsView /> },
        ],
      },
      {
        path: "videos",
        children: [
          {
            path: ":naddr",
            element: <VideoDetailsView />,
          },
          {
            path: "",
            element: <VideosView />,
          },
        ],
      },
      {
        path: "dvm",
        children: [
          { path: ":addr", element: <DVMFeedView /> },
          { path: "", element: <DVMFeedHomeView /> },
        ],
      },
      { path: "search", element: <SearchView /> },
      {
        path: "dm",
        element: <DirectMessagesView />,
        children: [{ path: ":pubkey", element: <DirectMessageChatView /> }],
      },
      { path: "profile", element: <ProfileView /> },
      {
        path: "tools",
        children: [
          { path: "", element: <ToolsHomeView /> },
          { path: "wot-test", element: <WotTestView /> },
          { path: "network-mute-graph", element: <NetworkMuteGraphView /> },
          { path: "network-dm-graph", element: <NetworkDMGraphView /> },
          { path: "dm-timeline", element: <DMTimelineView /> },
          { path: "transform/:id", element: <TransformNoteView /> },
          { path: "satellite-cdn", element: <SatelliteCDNView /> },
          { path: "unknown", element: <UnknownTimelineView /> },
        ],
      },
      {
        path: "things",
        children: [
          { path: "", element: <ThingsView /> },
          { path: "upload", element: <ThingUploadView /> },
        ],
      },
      {
        path: "lists",
        children: [
          { path: "", element: <ListsHomeView /> },
          { path: "browse", element: <BrowseListView /> },
          { path: ":addr", element: <ListView /> },
        ],
      },
      {
        path: "bookmarks",
        children: [
          { path: ":pubkey", element: <BookmarksView /> },
          { path: "", element: <BookmarksView /> },
        ],
      },
      {
        path: "communities",
        children: [
          { path: "", element: <CommunitiesHomeView /> },
          { path: "explore", element: <CommunitiesExploreView /> },
        ],
      },
      {
        path: "c/:community",
        children: [
          { path: "", element: <CommunityFindByNameView /> },
          {
            path: ":pubkey",
            element: <CommunityView />,
            children: [
              { path: "", element: <CommunityNewestView /> },
              { path: "trending", element: <CommunityTrendingView /> },
              { path: "newest", element: <CommunityNewestView /> },
              { path: "pending", element: <CommunityPendingView /> },
            ],
          },
        ],
      },
      {
        path: "torrents",
        children: [
          { path: "", element: <TorrentsView /> },
          { path: "new", element: <NewTorrentView /> },
          { path: ":id", element: <TorrentDetailsView /> },
        ],
      },
      {
        path: "channels",
        children: [
          { path: "", element: <ChannelsHomeView /> },
          { path: ":id", element: <ChannelView /> },
        ],
      },
      {
        path: "goals",
        children: [
          { path: "", element: <GoalsView /> },
          { path: "browse", element: <GoalsBrowseView /> },
          { path: ":id", element: <GoalDetailsView /> },
        ],
      },
      {
        path: "badges",
        children: [
          { path: "", element: <BadgesView /> },
          { path: "browse", element: <BadgesBrowseView /> },
          { path: ":naddr", element: <BadgeDetailsView /> },
        ],
      },
      {
        path: "emojis",
        children: [
          { path: "", element: <EmojiPacksView /> },
          { path: "browse", element: <EmojiPacksBrowseView /> },
          { path: ":addr", element: <EmojiPackView /> },
        ],
      },
      {
        path: "streams",
        element: <StreamsView />,
      },
      {
        path: "tracks",
        element: <TracksView />,
      },
      { path: "l/:link", element: <NostrLinkView /> },
      { path: "t/:hashtag", element: <HashTagView /> },
      {
        path: "",
        element: <HomeView />,
      },
    ],
  },
]);

export const App = () => (
  <ErrorBoundary>
    <DrawerSubViewProvider parentRouter={router}>
      <Global styles={overrideReactTextareaAutocompleteStyles} />
      <Suspense fallback={<Spinner />}>
        <RouterProvider router={router} />
      </Suspense>
    </DrawerSubViewProvider>
  </ErrorBoundary>
);
