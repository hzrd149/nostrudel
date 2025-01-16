import { lazy } from "react";
import { RouteObject } from "react-router";

const GoalsHomeView = lazy(() => import("."));
const GoalsBrowseView = lazy(() => import("./browse"));
const GoalDetailsView = lazy(() => import("./goal-details"));

export default [
  { index: true, Component: GoalsHomeView },
  { path: "browse", Component: GoalsBrowseView },
  { path: ":id", Component: GoalDetailsView },
] satisfies RouteObject[];
