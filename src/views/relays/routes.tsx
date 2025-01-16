import { lazy } from "react";
import { RouteObject } from "react-router";

const RelaysView = lazy(() => import("."));
const AppRelaysView = lazy(() => import("./app"));
const CacheRelayView = lazy(() => import("./cache"));
const DatabaseView = lazy(() => import("./cache/database"));
const MailboxesView = lazy(() => import("./mailboxes"));
const SearchRelaysView = lazy(() => import("./search"));
const MediaServersView = lazy(() => import("../settings/media-servers"));
const NIP05RelaysView = lazy(() => import("./nip05"));
const ContactListRelaysView = lazy(() => import("./contact-list"));
const WebRtcRelaysView = lazy(() => import("./webrtc"));
const WebRtcConnectView = lazy(() => import("./webrtc/connect"));
const WebRtcPairView = lazy(() => import("./webrtc/pair"));
const BrowseRelaySetsView = lazy(() => import("./browse-sets"));
const RelaySetView = lazy(() => import("./relay-set"));

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
