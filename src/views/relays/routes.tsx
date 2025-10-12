import { RouteObject } from "react-router-dom";

import relayRoutes from "./relay/routes";
import RelayDiscoveryView from "../discovery/relays";

export default [
  { index: true, element: <RelayDiscoveryView /> },
  { path: ":relay", children: relayRoutes },
] satisfies RouteObject[];
