import { RouteObject } from "react-router-dom";

import BlossomDiscoveryView from "./discovery";
import serverRoutes from "./server/routes";

export default [
  { index: true, element: <BlossomDiscoveryView /> },
  { path: ":server", children: serverRoutes },
] satisfies RouteObject[];
