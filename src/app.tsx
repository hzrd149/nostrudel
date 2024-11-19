import { lazy, Suspense } from "react";
import { createHashRouter, Outlet, RouterProvider, ScrollRestoration } from "react-router-dom";
import { Spinner } from "@chakra-ui/react";

import { ErrorBoundary } from "./components/error-boundary";
import Layout from "./components/layout";
import DrawerSubViewProvider from "./providers/drawer-sub-view-provider";
import useSetColorMode from "./hooks/use-set-color-mode";
import { RouteProviders } from "./providers/route";
import RequireCurrentAccount from "./providers/route/require-current-account";
import GlobalStyles from "./styles";

import HomeView from "./views/home/index";
const DiscoveryHomeView = lazy(() => import("./views/discovery/index"));
const DVMFeedView = lazy(() => import("./views/discovery/dvm-feed/feed"));
const BlindspotHomeView = lazy(() => import("./views/discovery/blindspot"));
const BlindspotFeedView = lazy(() => import("./views/discovery/blindspot/feed"));
const RelayDiscoveryView = lazy(() => import("./views/discovery/relays/index"));
import SettingsView from "./views/settings";
import NostrLinkView from "./views/link";
import ProfileView from "./views/profile";
const HashTagView = lazy(() => import("./views/hashtag"));
import ThreadView from "./views/thread";
import NotificationsView from "./views/notifications";
import ThreadsNotificationsView from "./views/notifications/threads";
const DirectMessagesView = lazy(() => import("./views/dms"));
const DirectMessageChatView = lazy(() => import("./views/dms/chat"));

import SigninView from "./views/signin";
import SignupView from "./views/signup";
import LoginStartView from "./views/signin/start";
import LoginNpubView from "./views/signin/pubkey";
import LoginNsecView from "./views/signin/nsec";
import LoginNostrConnectView from "./views/signin/nostr-connect";
import LoginNostrAddressView from "./views/signin/address";
import LoginNostrAddressCreate from "./views/signin/address/create";

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
import UserDMsTab from "./views/user/dms";
const UserTorrentsTab = lazy(() => import("./views/user/torrents"));

import ListsHomeView from "./views/lists";
import ListView from "./views/lists/list";
import BrowseListView from "./views/lists/browse";

const EmojiPacksBrowseView = lazy(() => import("./views/emoji-packs/browse"));
const EmojiPackView = lazy(() => import("./views/emoji-packs/emoji-pack"));
const UserEmojiPacksTab = lazy(() => import("./views/user/emoji-packs"));
const EmojiPacksView = lazy(() => import("./views/emoji-packs"));

const GoalsView = lazy(() => import("./views/goals"));
const GoalsBrowseView = lazy(() => import("./views/goals/browse"));
const GoalDetailsView = lazy(() => import("./views/goals/goal-details"));

const BadgesView = lazy(() => import("./views/badges"));
const BadgesBrowseView = lazy(() => import("./views/badges/browse"));
const BadgeDetailsView = lazy(() => import("./views/badges/badge-details"));

const CommunitiesHomeView = lazy(() => import("./views/communities"));
const CommunityFindByNameView = lazy(() => import("./views/community/find-by-name"));
const CommunityView = lazy(() => import("./views/community/index"));
const CommunityPendingView = lazy(() => import("./views/community/views/pending"));
const CommunityNewestView = lazy(() => import("./views/community/views/newest"));

import RelaysView from "./views/relays";
import RelayView from "./views/relays/relay";
import BrowseRelaySetsView from "./views/relays/browse-sets";
import CacheRelayView from "./views/relays/cache";
import RelaySetView from "./views/relays/relay-set";
import AppRelays from "./views/relays/app";
import MailboxesView from "./views/relays/mailboxes";
import MediaServersView from "./views/relays/media-servers";
import NIP05RelaysView from "./views/relays/nip05";
import DatabaseView from "./views/relays/cache/database";
import ContactListRelaysView from "./views/relays/contact-list";
const WebRtcRelaysView = lazy(() => import("./views/relays/webrtc"));
const WebRtcConnectView = lazy(() => import("./views/relays/webrtc/connect"));
const WebRtcPairView = lazy(() => import("./views/relays/webrtc/pair"));

import OtherStuffView from "./views/other-stuff";
import LaunchpadView from "./views/launchpad";
const VideosView = lazy(() => import("./views/videos"));
const VideoDetailsView = lazy(() => import("./views/videos/video"));
import BookmarksView from "./views/bookmarks";
import TaskManagerProvider from "./views/task-manager/provider";
import SearchRelaysView from "./views/relays/search";
import DisplaySettings from "./views/settings/display";
import LightningSettings from "./views/settings/lightning";
import PerformanceSettings from "./views/settings/performance";
import PrivacySettings from "./views/settings/privacy";
import PostSettings from "./views/settings/post";
import AccountSettings from "./views/settings/accounts";
import ArticlesHomeView from "./views/articles";
import ArticleView from "./views/articles/article";
import WalletView from "./views/wallet";
const TracksView = lazy(() => import("./views/tracks"));
const UserTracksTab = lazy(() => import("./views/user/tracks"));
const UserVideosTab = lazy(() => import("./views/user/videos"));

const ToolsHomeView = lazy(() => import("./views/tools"));
const NetworkMuteGraphView = lazy(() => import("./views/tools/network-mute-graph"));
const NetworkDMGraphView = lazy(() => import("./views/tools/network-dm-graph"));
const UnknownTimelineView = lazy(() => import("./views/tools/unknown-event-feed"));
const EventConsoleView = lazy(() => import("./views/tools/event-console"));
const EventPublisherView = lazy(() => import("./views/tools/event-publisher"));
const DMTimelineView = lazy(() => import("./views/tools/dm-timeline"));
const TransformNoteView = lazy(() => import("./views/tools/transform-note"));
const SatelliteCDNView = lazy(() => import("./views/tools/satellite-cdn"));
const CorrectionsFeedView = lazy(() => import("./views/tools/corrections"));

const UserStreamsTab = lazy(() => import("./views/user/streams"));
const StreamsView = lazy(() => import("./views/streams"));
const StreamView = lazy(() => import("./views/streams/stream"));
const StreamModerationView = lazy(() => import("./views/streams/dashboard"));

const SearchView = lazy(() => import("./views/search"));
const MapView = lazy(() => import("./views/map"));

const ChannelsHomeView = lazy(() => import("./views/channels"));
const ChannelView = lazy(() => import("./views/channels/channel"));

const TorrentsView = lazy(() => import("./views/torrents"));
const TorrentDetailsView = lazy(() => import("./views/torrents/torrent"));
const NewTorrentView = lazy(() => import("./views/torrents/new"));

const WikiHomeView = lazy(() => import("./views/wiki"));
const WikiPageView = lazy(() => import("./views/wiki/page"));
const WikiTopicView = lazy(() => import("./views/wiki/topic"));
const WikiSearchView = lazy(() => import("./views/wiki/search"));
const WikiCompareView = lazy(() => import("./views/wiki/compare"));
const CreateWikiPageView = lazy(() => import("./views/wiki/create"));
const EditWikiPageView = lazy(() => import("./views/wiki/edit"));

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
      { path: "nsec", element: <LoginNsecView /> },
      {
        path: "address",
        children: [
          { path: "", element: <LoginNostrAddressView /> },
          { path: "create", element: <LoginNostrAddressCreate /> },
        ],
      },
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
    path: "/discovery/relays",
    element: (
      <RouteProviders>
        <RelayDiscoveryView />
      </RouteProviders>
    ),
  },
  {
    path: "/tools/publisher",
    element: (
      <RouteProviders>
        <EventPublisherView />
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
          { path: "reactions", element: <UserReactionsTab /> },
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
      {
        path: "settings",
        element: <SettingsView />,
        children: [
          { path: "", element: <DisplaySettings /> },
          { path: "post", element: <PostSettings /> },
          {
            path: "accounts",
            element: (
              <RequireCurrentAccount>
                <AccountSettings />
              </RequireCurrentAccount>
            ),
          },
          { path: "display", element: <DisplaySettings /> },
          { path: "privacy", element: <PrivacySettings /> },
          { path: "lightning", element: <LightningSettings /> },
          { path: "performance", element: <PerformanceSettings /> },
          { path: "media-servers", element: <MediaServersView /> },
        ],
      },
      {
        path: "relays",
        element: <RelaysView />,
        children: [
          { path: "", element: <AppRelays /> },
          { path: "app", element: <AppRelays /> },
          {
            path: "cache",
            children: [
              { path: "database", element: <DatabaseView /> },
              { path: "", element: <CacheRelayView /> },
            ],
          },
          { path: "mailboxes", element: <MailboxesView /> },
          { path: "search", element: <SearchRelaysView /> },
          { path: "media-servers", element: <MediaServersView /> },
          { path: "nip05", element: <NIP05RelaysView /> },
          { path: "contacts", element: <ContactListRelaysView /> },
          {
            path: "webrtc",
            children: [
              { path: "connect", element: <WebRtcConnectView /> },
              { path: "pair", element: <WebRtcPairView /> },
              { path: "", element: <WebRtcRelaysView /> },
            ],
          },
          { path: "sets", element: <BrowseRelaySetsView /> },
          { path: ":id", element: <RelaySetView /> },
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
        path: "wallet",
        children: [
          {
            path: "",
            element: (
              <RequireCurrentAccount>
                <WalletView />
              </RequireCurrentAccount>
            ),
          },
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
        path: "wiki",
        children: [
          { path: "search", element: <WikiSearchView /> },
          { path: "topic/:topic", element: <WikiTopicView /> },
          { path: "page/:naddr", element: <WikiPageView /> },
          { path: "edit/:topic", element: <EditWikiPageView /> },
          { path: "compare/:topic/:a/:b", element: <WikiCompareView /> },
          { path: "create", element: <CreateWikiPageView /> },
          { path: "", element: <WikiHomeView /> },
        ],
      },
      {
        path: "discovery",
        children: [
          { path: "", element: <DiscoveryHomeView /> },
          { path: "dvm/:addr", element: <DVMFeedView /> },
          {
            path: "blindspot",
            element: (
              <RequireCurrentAccount>
                <Outlet />
              </RequireCurrentAccount>
            ),
            children: [
              { path: "", element: <BlindspotHomeView /> },
              { path: ":pubkey", element: <BlindspotFeedView /> },
            ],
          },
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
          { path: "network-mute-graph", element: <NetworkMuteGraphView /> },
          { path: "network-dm-graph", element: <NetworkDMGraphView /> },
          { path: "dm-timeline", element: <DMTimelineView /> },
          { path: "transform/:id", element: <TransformNoteView /> },
          { path: "satellite-cdn", element: <SatelliteCDNView /> },
          { path: "unknown", element: <UnknownTimelineView /> },
          { path: "console", element: <EventConsoleView /> },
          { path: "corrections", element: <CorrectionsFeedView /> },
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
        children: [{ path: "", element: <CommunitiesHomeView /> }],
      },
      {
        path: "articles",
        children: [
          { path: "", element: <ArticlesHomeView /> },
          { path: ":naddr", element: <ArticleView /> },
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
    <GlobalStyles />
    <TaskManagerProvider parentRouter={router}>
      <DrawerSubViewProvider parentRouter={router}>
        <Suspense fallback={<Spinner />}>
          <RouterProvider router={router} />
        </Suspense>
      </DrawerSubViewProvider>
    </TaskManagerProvider>
  </ErrorBoundary>
);
