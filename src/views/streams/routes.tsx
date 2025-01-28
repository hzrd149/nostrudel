import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const StreamHomeView = lazy(() => import("."));
const StreamView = lazy(() => import("./stream"));
const StreamModerationView = lazy(() => import("./dashboard"));

export default [
  { index: true, Component: StreamHomeView },
  { path: ":naddr", Component: StreamView },
  { path: "moderation", Component: StreamModerationView },
] satisfies RouteObject[];
