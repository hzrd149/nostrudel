import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const ToolsHomeView = lazy(() => import("."));
const EventConsoleView = lazy(() => import("./event-console"));
const EventPublisherView = lazy(() => import("./event-publisher"));

export default [
  { index: true, Component: ToolsHomeView },
  { path: "console", Component: EventConsoleView },
  { path: "publisher", Component: EventPublisherView },
] satisfies RouteObject[];
