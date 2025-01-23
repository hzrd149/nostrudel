import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const ChannelsHomeView = lazy(() => import("."));
const ChannelView = lazy(() => import("./channel"));
const ChannelsExploreView = lazy(() => import("./explore"));

export default [
  {
    Component: ChannelsHomeView,
    children: [
      { index: true, Component: ChannelsExploreView },
      { path: "explore", Component: ChannelsExploreView },
      { path: ":id", Component: ChannelView },
    ],
  },
] satisfies RouteObject[];
