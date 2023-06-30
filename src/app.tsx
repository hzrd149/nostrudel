import React, { Suspense, useEffect } from "react";
import { createHashRouter, Outlet, RouterProvider, ScrollRestoration, useLocation } from "react-router-dom";
import { Spinner, useColorMode } from "@chakra-ui/react";
import { ErrorBoundary } from "./components/error-boundary";
import { Page } from "./components/page";
import useSubject from "./hooks/use-subject";

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
import RelaysView from "./views/relays";
import LoginNip05View from "./views/login/nip05";
import LoginNsecView from "./views/login/nsec";
import UserZapsTab from "./views/user/zaps";
import DirectMessagesView from "./views/dm";
import DirectMessageChatView from "./views/dm/chat";
import NostrLinkView from "./views/link";
import UserReportsTab from "./views/user/reports";
import appSettings from "./services/app-settings";
import UserMediaTab from "./views/user/media";
import ToolsHomeView from "./views/tools";
import Nip19ToolsView from "./views/tools/nip19";
import UserAboutTab from "./views/user/about";
// code split search view because QrScanner library is 400kB
const SearchView = React.lazy(() => import("./views/search"));

const RootPage = () => {
  console.log(useLocation());

  return (
    <Page>
      <ScrollRestoration />
      <Suspense fallback={<Spinner />}>
        <Outlet />
      </Suspense>
    </Page>
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
          { path: "media", element: <UserMediaTab /> },
          { path: "zaps", element: <UserZapsTab /> },
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
      { path: "relays", element: <RelaysView /> },
      { path: "notifications", element: <NotificationsView /> },
      { path: "search", element: <SearchView /> },
      { path: "dm", element: <DirectMessagesView /> },
      { path: "dm/:key", element: <DirectMessageChatView /> },
      { path: "profile", element: <ProfileView /> },
      {
        path: "tools",
        children: [
          { path: "", element: <ToolsHomeView /> },
          { path: "nip19", element: <Nip19ToolsView /> },
        ],
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

export const App = () => {
  const { setColorMode } = useColorMode();
  const { colorMode } = useSubject(appSettings);

  useEffect(() => {
    setColorMode(colorMode);
  }, [colorMode]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<Spinner />}>
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  );
};
