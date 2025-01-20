import { Outlet, RouteObject } from "react-router-dom";
import RequireCurrentAccount from "../../components/router/require-current-account";
import DiscoveryHomeView from ".";
import DVMFeedView from "./dvm-feed/feed";
import BlindspotHomeView from "./blindspot";
import BlindspotFeedView from "./blindspot/feed";
import RelayDiscoveryView from "./relays";

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
