import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const ChannelsHomeView = lazy(() => import("."));
const GroupView = lazy(() => import("./group"));
const GroupsExploreView = lazy(() => import("./explore"));

export default [
  {
    Component: ChannelsHomeView,
    children: [
      { index: true, Component: GroupsExploreView },
      { path: "explore", Component: GroupsExploreView },
      { path: ":identifier", Component: GroupView },
    ],
  },
] satisfies RouteObject[];
