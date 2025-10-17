import { RouteObject } from "react-router-dom";

import FeedsHomeView from ".";
import HomeView from "../home";
import blindspotRoutes from "./blindspot/routes";
import DVMFeedsView from "./dvm";
import DVMFeedView from "./dvm/feed";
import relaysRoutes from "./relays/routes";

export default [
  { index: true, Component: FeedsHomeView },
  { path: "notes", Component: HomeView },
  {
    path: "dvm",
    children: [
      { index: true, Component: DVMFeedsView },
      { path: ":addr", Component: DVMFeedView },
    ],
  },
  {
    path: "relays",
    children: relaysRoutes,
  },
  {
    path: "blindspot",
    children: blindspotRoutes,
  },
] satisfies RouteObject[];
