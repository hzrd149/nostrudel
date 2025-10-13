import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const GoalDetailsView = lazy(() => import("./goal-details"));

export default [{ path: ":id", Component: GoalDetailsView }] satisfies RouteObject[];
