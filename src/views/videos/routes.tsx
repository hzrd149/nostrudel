import { lazy } from "react";
import { RouteObject } from "react-router";

const VideosView = lazy(() => import("."));
const VideoDetailsView = lazy(() => import("./video"));

export default [
  {
    index: true,
    Component: VideosView,
  },
  {
    path: ":naddr",
    Component: VideoDetailsView,
  },
] satisfies RouteObject[];
