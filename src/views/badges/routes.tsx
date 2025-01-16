import { lazy } from "react";
import { RouteObject } from "react-router";

const BadgesHomeView = lazy(() => import("."));
const BadgesBrowseView = lazy(() => import("./browse"));
const BadgeDetailsView = lazy(() => import("./badge-details"));

export default [
  { index: true, Component: BadgesHomeView },
  { path: "browse", Component: BadgesBrowseView },
  { path: ":naddr", Component: BadgeDetailsView },
] satisfies RouteObject[];
