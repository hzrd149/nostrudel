import React, { Suspense } from "react";
import { createHashRouter, Outlet, RouterProvider, ScrollRestoration } from "react-router-dom";
import { Spinner } from "@chakra-ui/react";
import { ErrorBoundary } from "./components/error-boundary";
import Layout from "./components/layout";

import HomeView from "./views/home";
import SettingsView from "./views/settings";
import LoginView from "./views/login";
import ProfileView from "./views/profile";
import FollowingTab from "./views/home/following-tab";
import GlobalTab from "./views/home/global-tab";
import HashTagView from "./views/hashtag";
import UserView from "./views/user";
import UserNotesTab from "./views/user/notes";
import UserFollowersTab from "./views/user/followers";
import UserRelaysTab from "./views/user/relays";
import UserFollowingTab from "./views/user/following";
import NoteView from "./views/note";
import LoginStartView from "./views/login/start";
import LoginNpubView from "./views/login/npub";
import NotificationsView from "./views/notifications";
import LoginNip05View from "./views/login/nip05";
import LoginNsecView from "./views/login/nsec";
import UserZapsTab from "./views/user/zaps";
import DirectMessagesView from "./views/messages";
import DirectMessageChatView from "./views/messages/chat";
import NostrLinkView from "./views/link";
import UserReportsTab from "./views/user/reports";
import ToolsHomeView from "./views/tools";
import UserAboutTab from "./views/user/about";
import UserLikesTab from "./views/user/likes";
import useSetColorMode from "./hooks/use-set-color-mode";
import UserStreamsTab from "./views/user/streams";
import { PageProviders } from "./providers";
import RelaysView from "./views/relays";
import RelayView from "./views/relays/relay";
import RelayReviewsView from "./views/relays/reviews";
import ListsView from "./views/lists";
import ListView from "./views/lists/list";
import UserListsTab from "./views/user/lists";

const StreamsView = React.lazy(() => import("./views/streams"));
const StreamView = React.lazy(() => import("./views/streams/stream"));
const SearchView = React.lazy(() => import("./views/search"));
const MapView = React.lazy(() => import("./views/map"));

const RootPage = () => {
  useSetColorMode();

  return (
    <PageProviders>
      <Layout>
        <ScrollRestoration />
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </Layout>
    </PageProviders>
  );
};

const router = createHashRouter([
  {
    path: "login",
    element: <LoginView />,
    children: [
      { path: "", element: <LoginStartView /> },
      { path: "npub", element: <LoginNpubView /> },
      { path: "nip05", element: <LoginNip05View /> },
      { path: "nsec", element: <LoginNsecView /> },
    ],
  },
  {
    path: "streams/:naddr",
    element: (
      <PageProviders>
        <StreamView />
      </PageProviders>
    ),
  },
  {
    path: "map",
    element: <MapView />,
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
          { path: "streams", element: <UserStreamsTab /> },
          { path: "zaps", element: <UserZapsTab /> },
          { path: "likes", element: <UserLikesTab /> },
          { path: "lists", element: <UserListsTab /> },
          { path: "followers", element: <UserFollowersTab /> },
          { path: "following", element: <UserFollowingTab /> },
          { path: "relays", element: <UserRelaysTab /> },
          { path: "reports", element: <UserReportsTab /> },
        ],
      },
      {
        path: "/n/:id",
        element: <NoteView />,
      },
      { path: "settings", element: <SettingsView /> },
      { path: "relays/reviews", element: <RelayReviewsView /> },
      { path: "relays", element: <RelaysView /> },
      { path: "r/:relay", element: <RelayView /> },
      { path: "notifications", element: <NotificationsView /> },
      { path: "search", element: <SearchView /> },
      { path: "dm", element: <DirectMessagesView /> },
      { path: "dm/:key", element: <DirectMessageChatView /> },
      { path: "profile", element: <ProfileView /> },
      {
        path: "tools",
        children: [{ path: "", element: <ToolsHomeView /> }],
      },
      {
        path: "lists",
        children: [
          { path: "", element: <ListsView /> },
          { path: ":addr", element: <ListView /> },
        ],
      },
      {
        path: "streams",
        element: <StreamsView />,
      },
      { path: "l/:link", element: <NostrLinkView /> },
      { path: "t/:hashtag", element: <HashTagView /> },
      {
        path: "",
        element: <HomeView />,
        children: [
          { path: "", element: <FollowingTab /> },
          { path: "following", element: <FollowingTab /> },
          { path: "global", element: <GlobalTab /> },
        ],
      },
    ],
  },
]);

export const App = () => (
  <ErrorBoundary>
    <Suspense fallback={<Spinner />}>
      <RouterProvider router={router} />
    </Suspense>
  </ErrorBoundary>
);
