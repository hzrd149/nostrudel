import { lazy } from "react";
import { RouteObject } from "react-router-dom";

import RelaysView from ".";
import AppRelaysView from "../settings/relays";
import CacheRelayView from "../settings/cache";
import DatabaseView from "../settings/cache/database";
import MailboxesView from "../settings/mailboxes";
import MediaServersView from "../settings/media-servers";
import SearchSettings from "../settings/search";
import NIP05RelaysView from "./nip05";
import ContactListRelaysView from "./contact-list";
const WebRtcRelaysView = lazy(() => import("./webrtc"));
const WebRtcConnectView = lazy(() => import("./webrtc/connect"));
const WebRtcPairView = lazy(() => import("./webrtc/pair"));
import BrowseRelaySetsView from "./browse-sets";
const RelayDetailsView = lazy(() => import("./relay-details"));

export default [
  { path: ":relay", element: <RelayDetailsView /> },
  {
    element: <RelaysView />,
    children: [
      { index: true, element: <AppRelaysView /> },
      { path: "app", element: <AppRelaysView /> },
      {
        path: "cache",
        children: [
          { index: true, element: <CacheRelayView /> },
          { path: "database", element: <DatabaseView /> },
        ],
      },
      { path: "mailboxes", element: <MailboxesView /> },
      { path: "search", element: <SearchSettings /> },
      { path: "media-servers", element: <MediaServersView /> },
      { path: "nip05", element: <NIP05RelaysView /> },
      { path: "contacts", element: <ContactListRelaysView /> },
      {
        path: "webrtc",
        children: [
          { index: true, element: <WebRtcRelaysView /> },
          { path: "connect", element: <WebRtcConnectView /> },
          { path: "pair", element: <WebRtcPairView /> },
        ],
      },
      { path: "sets", element: <BrowseRelaySetsView /> },
    ],
  },
] satisfies RouteObject[];
