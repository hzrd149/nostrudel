import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const ChannelsHomeView = lazy(() => import("."));
const ChannelView = lazy(() => import("./channel"));

export default [
  { index: true, Component: ChannelsHomeView },
  { path: ":id", Component: ChannelView },
] satisfies RouteObject[];
