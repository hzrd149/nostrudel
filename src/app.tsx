import { lazy, Suspense } from "react";
import { Spinner } from "@chakra-ui/react";
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration, Location } from "react-router";

import GlobalStyles from "./styles";

import { ErrorBoundary } from "./components/error-boundary";
import AppLayout from "./components/layout";
import DrawerSubViewProvider from "./providers/drawer-sub-view-provider";
import { RouteProviders } from "./providers/route";
import useSetColorMode from "./hooks/use-set-color-mode";

import TaskManagerProvider from "./views/task-manager/provider";

const getScrollKey = (location: Location) => location.pathname + location.search + location.hash;

const RootPage = () => {
  useSetColorMode();

  return (
    <RouteProviders>
      <ScrollRestoration getKey={getScrollKey} />
      <AppLayout />
    </RouteProviders>
  );
};
const NoLayoutPage = () => {
  return (
    <RouteProviders>
      <ScrollRestoration getKey={getScrollKey} />
      <Suspense fallback={<Spinner />}>
        <Outlet />
      </Suspense>
    </RouteProviders>
  );
};

// one off views
import NostrLinkView from "./views/link";
const HomeView = lazy(() => import("./views/home"));
const ProfileView = lazy(() => import("./views/profile"));
const MapView = lazy(() => import("./views/map"));
const LaunchpadView = lazy(() => import("./views/launchpad"));
const OtherStuffView = lazy(() => import("./views/other-stuff"));
const ThreadView = lazy(() => import("./views/thread"));
const NotificationsView = lazy(() => import("./views/notifications"));
const RelayView = lazy(() => import("./views/relays/relay"));
const SearchView = lazy(() => import("./views/search"));
const SupportView = lazy(() => import("./views/support"));
const TracksView = lazy(() => import("./views/tracks"));
const HashTagView = lazy(() => import("./views/hashtag"));

// routes
import signinRoutes from "./views/signin/routes";
import signupRoutes from "./views/signup/routes";
import userRoutes from "./views/user/routes";
import newRoutes from "./views/new/routes";
import settingsRoutes from "./views/settings/routes";
import relaysRoutes from "./views/relays/routes";
import videosRoutes from "./views/videos/routes";
import mediaRoutes from "./views/media/routes";
import streamsRoutes from "./views/streams/routes";
import toolsRoutes from "./views/tools/routes";
import discoveryRoutes from "./views/discovery/routes";
import wikiRoutes from "./views/wiki/routes";
import filesRoutes from "./views/files/routes";
import messagesRoutes from "./views/messages/routes";
import listsRoutes from "./views/lists/routes";
import bookmarksRoutes from "./views/bookmarks/routes";
import articlesRoutes from "./views/articles/routes";
import torrentsRoutes from "./views/torrents/routes";
import channelsRoutes from "./views/channels/routes";
import goalsRoutes from "./views/goals/routes";
import badgesRoutes from "./views/badges/routes";
import emojisRoutes from "./views/emojis/routes";
import walletRoutes from "./views/wallet/routes";
import podcastsRoutes from "./views/podcasts/routes";

const router = createBrowserRouter([
  {
    path: "signin",
    Component: NoLayoutPage,
    children: signinRoutes,
  },
  {
    path: "signup",
    Component: NoLayoutPage,
    children: signupRoutes,
  },
  {
    Component: RootPage,
    children: [
      { index: true, Component: HomeView },
      { path: "notes", Component: HomeView },
      { path: "new", children: newRoutes },
      { path: "launchpad", Component: LaunchpadView },
      { path: "profile", Component: ProfileView },
      { path: "messages", children: messagesRoutes },
      { path: "user/:pubkey", children: userRoutes },
      { path: "u/:pubkey", children: userRoutes },
      { path: "note/:id", Component: ThreadView },
      { path: "n/:id", Component: ThreadView },
      { path: "search", Component: SearchView },
      { path: "other-stuff", Component: OtherStuffView },
      { path: "settings", children: settingsRoutes },
      { path: "relays", children: relaysRoutes },
      { path: "r/:relay", Component: RelayView },
      { path: "notifications", Component: NotificationsView },
      { path: "media", children: mediaRoutes },
      { path: "streams", children: streamsRoutes },
      { path: "tools", children: toolsRoutes },
      { path: "discovery", children: discoveryRoutes },
      { path: "wiki", children: wikiRoutes },
      { path: "support", Component: SupportView },
      { path: "l/:link", Component: NostrLinkView },
      { path: "t/:hashtag", Component: HashTagView },

      // other stuff
      { path: "articles", children: articlesRoutes },
      { path: "bookmarks", children: bookmarksRoutes },
      { path: "lists", children: listsRoutes },
      { path: "files", children: filesRoutes },
      { path: "tracks", Component: TracksView },
      { path: "map", Component: MapView },
      { path: "videos", children: videosRoutes },
      { path: "torrents", children: torrentsRoutes },
      { path: "channels", children: channelsRoutes },
      { path: "goals", children: goalsRoutes },
      { path: "badges", children: badgesRoutes },
      { path: "emojis", children: emojisRoutes },
      { path: "wallet", children: walletRoutes },
      { path: "podcasts", children: podcastsRoutes },
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
