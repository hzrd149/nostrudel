import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const ToolsHomeView = lazy(() => import("."));
const DMTimelineView = lazy(() => import("./dm-timeline"));
const TransformNoteView = lazy(() => import("./transform-note"));
const UnknownTimelineView = lazy(() => import("./unknown-event-feed"));
const EventConsoleView = lazy(() => import("./event-console"));
const CorrectionsFeedView = lazy(() => import("./corrections"));
const EventPublisherView = lazy(() => import("./event-publisher"));

export default [
  { index: true, Component: ToolsHomeView },
  { path: "dm-timeline", Component: DMTimelineView },
  { path: "transform/:id", Component: TransformNoteView },
  { path: "unknown", Component: UnknownTimelineView },
  { path: "console", Component: EventConsoleView },
  { path: "corrections", Component: CorrectionsFeedView },
  { path: "publisher", Component: EventPublisherView },
] satisfies RouteObject[];
