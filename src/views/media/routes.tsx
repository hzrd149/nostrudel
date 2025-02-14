import { RouteObject } from "react-router-dom";
import MediaFeedView from ".";
import MediaPostView from "./post";

export default [
  { index: true, Component: MediaFeedView },
  { path: ":pointer", Component: MediaPostView },
] satisfies RouteObject[];
