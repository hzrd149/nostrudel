import { lazy } from "react";
import { RouteObject } from "react-router";

const MediaFeedView = lazy(() => import("."));
const MediaPostView = lazy(() => import("./media-post"));

export default [
  { index: true, Component: MediaFeedView },
  { path: ":pointer", Component: MediaPostView },
] satisfies RouteObject[];
