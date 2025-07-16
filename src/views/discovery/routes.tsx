import { lazy } from "react";
import { Outlet, RouteObject } from "react-router-dom";

import RequireActiveAccount from "../../components/router/require-active-account";
import DiscoveryHomeView from ".";
import DVMFeedView from "./dvm-feed/feed";
import BlindspotHomeView from "./blindspot";
import BlindspotFeedView from "./blindspot/feed";
import RelayFeedView from "./relay-feed";
const RelayDiscoveryView = lazy(() => import("./relays"));

export default [
  { index: true, Component: DiscoveryHomeView },
  { path: "dvm/:addr", Component: DVMFeedView },
  { path: "relays", Component: RelayDiscoveryView },
  { path: "relay/:relay", Component: RelayFeedView },
  {
    path: "blindspot",
    element: (
      <RequireActiveAccount>
        <Outlet />
      </RequireActiveAccount>
    ),
    children: [
      { index: true, Component: BlindspotHomeView },
      { path: ":pubkey", Component: BlindspotFeedView },
    ],
  },
] satisfies RouteObject[];
