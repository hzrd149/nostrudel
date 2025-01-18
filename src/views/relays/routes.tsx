import { lazy } from "react";
import { RouteObject } from "react-router";
import RelaysView from ".";
import AppRelaysView from "./app";
import CacheRelayView from "./cache";
import DatabaseView from "./cache/database";
import MailboxesView from "./mailboxes";
import SearchRelaysView from "./search";
import MediaServersView from "../settings/media-servers";
import NIP05RelaysView from "./nip05";
import ContactListRelaysView from "./contact-list";
const WebRtcRelaysView = lazy(() => import("./webrtc"));
const WebRtcConnectView = lazy(() => import("./webrtc/connect"));
const WebRtcPairView = lazy(() => import("./webrtc/pair"));
import BrowseRelaySetsView from "./browse-sets";
import RelaySetView from "./relay-set";

export default [
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
      { path: "search", element: <SearchRelaysView /> },
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
      { path: ":id", element: <RelaySetView /> },
    ],
  },
] satisfies RouteObject[];
