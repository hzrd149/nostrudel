import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const ToolsHomeView = lazy(() => import("."));
const EventConsoleView = lazy(() => import("./event-console"));
const EventPublisherView = lazy(() => import("./event-publisher"));
const ExternalAppView = lazy(() => import("./external"));

export default [
  { index: true, Component: ToolsHomeView },
  { path: "console", Component: EventConsoleView },
  { path: "publisher", Component: EventPublisherView },
  { path: "external/:id", Component: ExternalAppView },
] satisfies RouteObject[];
