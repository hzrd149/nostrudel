import React from "react";
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from "react-router-dom";
import { HomeView } from "./views/home";
import { ErrorBoundary } from "./components/error-boundary";
import { Page } from "./components/page";
import { SettingsView } from "./views/settings";
import { LoginView } from "./views/login";
import { ProfileView } from "./views/profile";
import accountService from "./services/account";
import { FollowingTab } from "./views/home/following-tab";
import { DiscoverTab } from "./views/home/discover-tab";
import { GlobalTab } from "./views/home/global-tab";
import { normalizeToHex } from "./helpers/nip-19";
import UserView from "./views/user";
import UserNotesTab from "./views/user/notes";
import UserFollowersTab from "./views/user/followers";
import UserRelaysTab from "./views/user/relays";
import UserFollowingTab from "./views/user/following";
import NoteView from "./views/note";
import { LoginStartView } from "./views/login/start";
import { LoginNpubView } from "./views/login/npub";
import NotificationsView from "./views/notifications";
import { RelaysView } from "./views/relays";
import useSubject from "./hooks/use-subject";
import { LoginNip05View } from "./views/login/nip05";
import { Button, Flex, Spinner, Text } from "@chakra-ui/react";
import { deleteDatabase } from "./services/db";
import { LoginNsecView } from "./views/login/nsec";

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
      <Outlet />
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
          { path: "followers", element: <UserFollowersTab /> },
          { path: "following", element: <UserFollowingTab /> },
          { path: "relays", element: <UserRelaysTab /> },
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
      {
        path: "settings",
        element: <SettingsView />,
      },
      {
        path: "relays",
        element: <RelaysView />,
      },
      {
        path: "notifications",
        element: <NotificationsView />,
      },
      {
        path: "profile",
        element: <ProfileView />,
      },
      {
        path: "",
        element: <HomeView />,
        children: [
          { path: "", element: <FollowingTab /> },
          { path: "following", element: <FollowingTab /> },
          { path: "discover", element: <DiscoverTab /> },
          { path: "global", element: <GlobalTab /> },
        ],
      },
    ],
  },
]);

export const App = () => (
  <ErrorBoundary>
    <RouterProvider router={router} />
  </ErrorBoundary>
);
