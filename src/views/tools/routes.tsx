import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const ToolsHomeView = lazy(() => import("."));
const EventConsoleView = lazy(() => import("./event-console"));
const EventPublisherView = lazy(() => import("./event-publisher"));
const NappletToolView = lazy(() => import("./napplets"));

export default [
  { index: true, Component: ToolsHomeView },
  { path: "console", Component: EventConsoleView },
  { path: "publisher", Component: EventPublisherView },
  { path: "napplets/:address?", Component: NappletToolView },
] satisfies RouteObject[];
