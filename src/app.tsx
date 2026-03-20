import { Spinner } from "@chakra-ui/react";
import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";

import GlobalStyles from "./styles";

import { ErrorBoundary } from "./components/error-boundary";
import AppLayout from "./components/layout";
import useSetColorMode from "./hooks/use-set-color-mode";
import { RouteProviders } from "./providers/route";

import TaskManagerProvider from "./views/task-manager/provider";

// one off views
import NoteFoundView from "./views/404";
import HomeView from "./views/home";
import NostrLinkView from "./views/link";
import OtherStuffView from "./views/other-stuff";
import SearchView from "./views/search";
import SupportView from "./views/support";
import ThreadView from "./views/thread";

const HashTagView = lazy(() => import("./views/hashtag"));

// routes
import articlesRoutes from "./views/articles/routes";
import badgesRoutes from "./views/badges/routes";
import blossomRoutes from "./views/blossom/routes";
import bookmarksRoutes from "./views/bookmarks/routes";
import channelsRoutes from "./views/channels/routes";
import emojisRoutes from "./views/emojis/routes";
import feedsRoutes from "./views/feeds/routes";
import filesRoutes from "./views/files/routes";
import goalsRoutes from "./views/goals/routes";
import groupsRoutes from "./views/groups/routes";
import listsRoutes from "./views/lists/routes";
import messagesRoutes from "./views/messages/routes";
import newRoutes from "./views/new/routes";
import notificationsRoutes from "./views/notifications/routes";
import picturesRoutes from "./views/pictures/routes";
import relaysRoutes from "./views/relays/routes";
import settingsRoutes from "./views/settings/routes";
import signinRoutes from "./views/signin/routes";
import signupRoutes from "./views/signup/routes";
import streamsRoutes from "./views/streams/routes";
import toolsRoutes from "./views/tools/routes";
import torrentsRoutes from "./views/torrents/routes";
import userRoutes from "./views/user/routes";
import webxdcRoutes from "./views/webxdc/routes";
import walletRoutes from "./views/wallet/routes";
import wikiRoutes from "./views/wiki/routes";

// Redirect old hash routing
const hashPath = window.location.hash.match(/^#(\/.+)/);
if (hashPath) window.history.replaceState({}, "", hashPath[1]);

const RootPage = () => {
  useSetColorMode();

  return (
    <RouteProviders>
      <AppLayout />
    </RouteProviders>
  );
};

const NoLayoutPage = () => {
  return (
    <RouteProviders>
      <Outlet />
    </RouteProviders>
  );
};

export const router = createBrowserRouter(
  [
    { path: "*", Component: NoteFoundView },
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
        { path: "new", children: newRoutes },
        { path: "notes", Component: HomeView },
        { path: "feeds", children: feedsRoutes },
        { path: "messages", children: messagesRoutes },
        { path: "user/:pubkey", children: userRoutes },
        { path: "u/:pubkey", children: userRoutes },
        { path: "note/:id", Component: ThreadView },
        { path: "n/:id", Component: ThreadView },
        { path: "search", Component: SearchView },
        { path: "other-stuff", Component: OtherStuffView },
        { path: "settings", children: settingsRoutes },
        { path: "relays", children: relaysRoutes },
        { path: "blossom", children: blossomRoutes },
        { path: "notifications", children: notificationsRoutes },
        { path: "pictures", children: picturesRoutes },
        { path: "streams", children: streamsRoutes },
        { path: "groups", children: groupsRoutes },
        { path: "tools", children: toolsRoutes },
        { path: "wiki", children: wikiRoutes },
        { path: "support", Component: SupportView },
        { path: "l/:link", Component: NostrLinkView },
        { path: "t", Component: HashTagView },
        { path: "t/:hashtag", Component: HashTagView },

        // other stuff
        { path: "articles", children: articlesRoutes },
        { path: "bookmarks", children: bookmarksRoutes },
        { path: "lists", children: listsRoutes },
        { path: "files", children: filesRoutes },
        { path: "torrents", children: torrentsRoutes },
        { path: "webxdc", children: webxdcRoutes },
        { path: "channels", children: channelsRoutes },
        { path: "goals", children: goalsRoutes },
        { path: "badges", children: badgesRoutes },
        { path: "emojis", children: emojisRoutes },
        { path: "wallet", children: walletRoutes },
      ],
    },
  ],
  { future: { v7_relativeSplatPath: true } },
);

export const App = () => (
  <ErrorBoundary>
    <GlobalStyles />
    <TaskManagerProvider parentRouter={router}>
      <Suspense fallback={<Spinner />}>
        <RouterProvider router={router} />
      </Suspense>
    </TaskManagerProvider>
  </ErrorBoundary>
);
