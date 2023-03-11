import React, { Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from "react-router-dom";
import { Button, Flex, Spinner, Text } from "@chakra-ui/react";
import { ErrorBoundary } from "./components/error-boundary";
import { Page } from "./components/page";
import { normalizeToHex } from "./helpers/nip19";
import { deleteDatabase } from "./services/db";
import accountService from "./services/account";
import useSubject from "./hooks/use-subject";

const HomeView = React.lazy(() => import("./views/home"));
const SettingsView = React.lazy(() => import("./views/settings"));
const LoginView = React.lazy(() => import("./views/login"));
const ProfileView = React.lazy(() => import("./views/profile"));
const FollowingTab = React.lazy(() => import("./views/home/following-tab"));
const DiscoverTab = React.lazy(() => import("./views/home/discover-tab"));
const GlobalTab = React.lazy(() => import("./views/home/global-tab"));
const UserView = React.lazy(() => import("./views/user"));
const UserNotesTab = React.lazy(() => import("./views/user/notes"));
const UserFollowersTab = React.lazy(() => import("./views/user/followers"));
const UserRelaysTab = React.lazy(() => import("./views/user/relays"));
const UserFollowingTab = React.lazy(() => import("./views/user/following"));
const NoteView = React.lazy(() => import("./views/note"));
const LoginStartView = React.lazy(() => import("./views/login/start"));
const LoginNpubView = React.lazy(() => import("./views/login/npub"));
const NotificationsView = React.lazy(() => import("./views/notifications"));
const RelaysView = React.lazy(() => import("./views/relays"));
const LoginNip05View = React.lazy(() => import("./views/login/nip05"));
const LoginNsecView = React.lazy(() => import("./views/login/nsec"));
const UserZapsTab = React.lazy(() => import("./views/user/zaps"));
const DirectMessagesView = React.lazy(() => import("./views/dm"));
const DirectMessageChatView = React.lazy(() => import("./views/dm/chat"));
const NostrLinkView = React.lazy(() => import("./views/link"));
const UserReportsTab = React.lazy(() => import("./views/user/reports"));

const RequireCurrentAccount = ({ children }: { children: JSX.Element }) => {
  let location = useLocation();
  const loading = useSubject(accountService.loading);
  const account = useSubject(accountService.current);

  if (loading) {
    return (
      <Flex alignItems="center" height="100%" gap="4" direction="column">
        <Flex gap="4" grow="1" alignItems="center">
          <Spinner />
          <Text>Loading Accounts</Text>
        </Flex>
        <Button variant="link" margin="4" onClick={() => deleteDatabase()}>
          Stuck loading? clear cache
        </Button>
      </Flex>
    );
  }
  if (!account) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return children;
};

const RootPage = () => (
  <RequireCurrentAccount>
    <Page>
      <Suspense fallback={<Spinner />}>
        <Outlet />
      </Suspense>
    </Page>
  </RequireCurrentAccount>
);

const router = createBrowserRouter([
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
        loader: ({ params }) => {
          if (!params.pubkey) throw new Error("Missing pubkey");
          const hexKey = normalizeToHex(params.pubkey);
          if (!hexKey) throw new Error(params.pubkey + " is not a valid pubkey");
          return { pubkey: hexKey };
        },
        element: <UserView />,
        children: [
          { path: "", element: <UserNotesTab /> },
          { path: "notes", element: <UserNotesTab /> },
          { path: "zaps", element: <UserZapsTab /> },
          { path: "followers", element: <UserFollowersTab /> },
          { path: "following", element: <UserFollowingTab /> },
          { path: "relays", element: <UserRelaysTab /> },
          { path: "reports", element: <UserReportsTab /> },
        ],
      },
      {
        path: "/n/:id",
        loader: ({ params }) => {
          if (!params.id) throw new Error("Missing pubkey");
          const hex = normalizeToHex(params.id);
          if (!hex) throw new Error(params.id + " is not a valid event id");
          return { id: hex };
        },
        element: <NoteView />,
      },
      { path: "settings", element: <SettingsView /> },
      { path: "relays", element: <RelaysView /> },
      { path: "notifications", element: <NotificationsView /> },
      { path: "dm", element: <DirectMessagesView /> },
      { path: "dm/:key", element: <DirectMessageChatView /> },
      { path: "profile", element: <ProfileView /> },
      { path: "nostr-link", element: <NostrLinkView /> },
      {
        path: "",
        element: <HomeView />,
        children: [
          { path: "", element: <FollowingTab /> },
          { path: "following", element: <FollowingTab /> },
          { path: "discover", element: <DiscoverTab /> },
          // { path: "popular", element: <PopularTab /> },
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
