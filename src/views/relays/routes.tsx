import { lazy } from "react";
import { RouteObject } from "react-router-dom";

import relayRoutes from "./relay/routes";
const RelayMapView = lazy(() => import("./map"));

export default [
  { path: "map", Component: RelayMapView },
  { path: ":relay", children: relayRoutes },
] satisfies RouteObject[];
