import { Outlet, RouteObject } from "react-router";
import RequireCurrentAccount from "../../components/router/require-current-account";
import { lazy } from "react";

const DiscoveryHomeView = lazy(() => import("."));
const DVMFeedView = lazy(() => import("./dvm-feed/feed"));
const BlindspotHomeView = lazy(() => import("./blindspot"));
const BlindspotFeedView = lazy(() => import("./blindspot/feed"));
const RelayDiscoveryView = lazy(() => import("./relays"));

export default [
  { index: true, Component: DiscoveryHomeView },
  { path: "dvm/:addr", Component: DVMFeedView },
  { path: "relays", Component: RelayDiscoveryView },
  {
    path: "blindspot",
    element: (
      <RequireCurrentAccount>
        <Outlet />
      </RequireCurrentAccount>
    ),
    children: [
      { index: true, Component: BlindspotHomeView },
      { path: ":pubkey", Component: BlindspotFeedView },
    ],
  },
] satisfies RouteObject[];
