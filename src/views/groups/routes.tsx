import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const GroupsHomeView = lazy(() => import("."));
const GroupView = lazy(() => import("./group"));
const GroupsExploreView = lazy(() => import("./explore"));

export default [
  { index: true, Component: GroupsHomeView },
  { path: "explore", Component: GroupsExploreView },
  { path: ":identifier", Component: GroupView },
] satisfies RouteObject[];
