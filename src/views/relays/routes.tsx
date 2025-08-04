import { lazy } from "react";
import { RouteObject } from "react-router-dom";

import relayRoutes from "./relay/routes";

import RelayDiscoveryView from "../discovery/relays";
const WebRtcRelaysView = lazy(() => import("./webrtc"));
const WebRtcConnectView = lazy(() => import("./webrtc/connect"));
const WebRtcPairView = lazy(() => import("./webrtc/pair"));
const RelayDetailsView = lazy(() => import("./relay/tabs/about"));

export default [
  { index: true, element: <RelayDiscoveryView /> },
  { path: ":relay", children: relayRoutes },

  // Legacy routes
  {
    path: "webrtc",
    children: [
      { index: true, element: <WebRtcRelaysView /> },
      { path: "connect", element: <WebRtcConnectView /> },
      { path: "pair", element: <WebRtcPairView /> },
    ],
  },
] satisfies RouteObject[];
