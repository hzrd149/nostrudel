import React from "react";
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from "react-router-dom";
import { HomeView } from "./views/home";
import { ErrorBoundary } from "./components/error-boundary";
import { Page } from "./components/page";
import { SettingsView } from "./views/settings";
import { LoginView } from "./views/login";
import { ProfileView } from "./views/profile";
import useSubject from "./hooks/use-subject";
import identity from "./services/identity";
import { FollowingTab } from "./views/home/following-tab";
import { DiscoverTab } from "./views/home/discover-tab";
import { GlobalTab } from "./views/home/global-tab";
import { normalizeToHex } from "./helpers/nip-19";
import UserView from "./views/user";
import UserNotesTab from "./views/user/notes";
import UserRepliesTab from "./views/user/replies";
import UserFollowersTab from "./views/user/followers";
import UserRelaysTab from "./views/user/relays";
import UserFollowingTab from "./views/user/following";
import NoteView from "./views/note";

const RequireSetup = ({ children }: { children: JSX.Element }) => {
  let location = useLocation();
  const setup = useSubject(identity.setup);

  if (!setup) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return children;
};

const RootPage = () => (
  <RequireSetup>
    <Page>
      <Outlet />
    </Page>
  </RequireSetup>
);

const router = createBrowserRouter([
  { path: "login", element: <LoginView /> },
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
          { path: "replies", element: <UserRepliesTab /> },
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
