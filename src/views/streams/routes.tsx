import { RouteObject } from "react-router";

import StreamHomeView from ".";
import StreamView from "./stream";
import StreamModerationView from "./dashboard";

export default [
  { index: true, Component: StreamHomeView },
  { path: ":naddr", Component: StreamView },
  { path: "moderation", Component: StreamModerationView },
] satisfies RouteObject[];
