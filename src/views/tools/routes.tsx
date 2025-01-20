import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const ToolsHomeView = lazy(() => import("."));
const NetworkDMGraphView = lazy(() => import("./network-dm-graph"));
const DMTimelineView = lazy(() => import("./dm-timeline"));
const TransformNoteView = lazy(() => import("./transform-note"));
const UnknownTimelineView = lazy(() => import("./unknown-event-feed"));
const EventConsoleView = lazy(() => import("./event-console"));
const CorrectionsFeedView = lazy(() => import("./corrections"));
const NoStrudelUsersView = lazy(() => import("./nostrudel-users"));
const EventPublisherView = lazy(() => import("./event-publisher"));
const NetworkMuteGraphView = lazy(() => import("./network-mute-graph"));

export default [
  { index: true, Component: ToolsHomeView },
  { path: "network-mute-graph", Component: NetworkMuteGraphView },
  { path: "network-dm-graph", Component: NetworkDMGraphView },
  { path: "dm-timeline", Component: DMTimelineView },
  { path: "transform/:id", Component: TransformNoteView },
  { path: "unknown", Component: UnknownTimelineView },
  { path: "console", Component: EventConsoleView },
  { path: "corrections", Component: CorrectionsFeedView },
  { path: "nostrudel-users", Component: NoStrudelUsersView },
  { path: "publisher", Component: EventPublisherView },
] satisfies RouteObject[];
