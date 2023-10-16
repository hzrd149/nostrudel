import React, { Suspense } from "react";
import { createHashRouter, Outlet, RouterProvider, ScrollRestoration } from "react-router-dom";
import { Spinner } from "@chakra-ui/react";
import { css, Global } from "@emotion/react";

import { ErrorBoundary } from "./components/error-boundary";
import Layout from "./components/layout";
import { PageProviders } from "./providers";
import DrawerSubViewProvider from "./providers/drawer-sub-view-provider";
import useSetColorMode from "./hooks/use-set-color-mode";

import HomeView from "./views/home/index";
import SettingsView from "./views/settings";
import NostrLinkView from "./views/link";
import ProfileView from "./views/profile";
import HashTagView from "./views/hashtag";
import NoteView from "./views/note";
import NotificationsView from "./views/notifications";
import DirectMessagesView from "./views/messages";
import DirectMessageChatView from "./views/messages/chat";

import LoginView from "./views/signin";
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

import ListsView from "./views/lists";
import ListDetailsView from "./views/lists/list-details";
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
import CommunityFindByNameView from "./views/community/find-by-name";
import CommunityView from "./views/community/index";
import CommunityPendingView from "./views/community/views/pending";
import CommunityNewView from "./views/community/views/new";

import RelaysView from "./views/relays";
import RelayView from "./views/relays/relay";
import RelayReviewsView from "./views/relays/reviews";
import PopularRelaysView from "./views/relays/popular";
import UserTracksTab from "./views/user/tracks";
import SignupView from "./views/signup";

const ToolsHomeView = React.lazy(() => import("./views/tools"));
const NetworkView = React.lazy(() => import("./views/tools/network"));
const StreamModerationView = React.lazy(() => import("./views/tools/stream-moderation"));
const NetworkGraphView = React.lazy(() => import("./views/tools/network-mute-graph"));

const UserStreamsTab = React.lazy(() => import("./views/user/streams"));
const StreamsView = React.lazy(() => import("./views/streams"));
const StreamView = React.lazy(() => import("./views/streams/stream"));

const SearchView = React.lazy(() => import("./views/search"));
const MapView = React.lazy(() => import("./views/map"));

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
    path: "signin",
    element: <LoginView />,
    children: [
      { path: "", element: <LoginStartView /> },
      { path: "npub", element: <LoginNpubView /> },
      { path: "nip05", element: <LoginNip05View /> },
      { path: "nsec", element: <LoginNsecView /> },
    ],
  },
  {
    path: "signup",
    children: [
      {
        path: "",
        element: (
          <PageProviders>
            <SignupView />
          </PageProviders>
        ),
      },
      {
        path: ":step",
        element: (
          <PageProviders>
            <SignupView />
          </PageProviders>
        ),
      },
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
    path: "tools/stream-moderation",
    element: (
      <PageProviders>
        <StreamModerationView />
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
          { path: "articles", element: <UserArticlesTab /> },
          { path: "streams", element: <UserStreamsTab /> },
          { path: "tracks", element: <UserTracksTab /> },
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
        ],
      },
      {
        path: "/n/:id",
        element: <NoteView />,
      },
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
      { path: "notifications", element: <NotificationsView /> },
      { path: "search", element: <SearchView /> },
      { path: "dm", element: <DirectMessagesView /> },
      { path: "dm/:key", element: <DirectMessageChatView /> },
      { path: "profile", element: <ProfileView /> },
      {
        path: "tools",
        children: [
          { path: "", element: <ToolsHomeView /> },
          { path: "network", element: <NetworkView /> },
          { path: "network-graph", element: <NetworkGraphView /> },
        ],
      },
      {
        path: "lists",
        children: [
          { path: "", element: <ListsView /> },
          { path: "browse", element: <BrowseListView /> },
          { path: ":addr", element: <ListDetailsView /> },
        ],
      },
      {
        path: "communities",
        element: <CommunitiesHomeView />,
      },
      {
        path: "c/:community",
        children: [
          { path: "", element: <CommunityFindByNameView /> },
          {
            path: ":pubkey",
            element: <CommunityView />,
            children: [
              { path: "", element: <CommunityNewView /> },
              { path: "pending", element: <CommunityPendingView /> },
            ],
          },
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
