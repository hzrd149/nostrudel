import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const BadgeDetailsView = lazy(() => import("./badge-details"));

export default [{ path: ":naddr", Component: BadgeDetailsView }] satisfies RouteObject[];
