import { RouteObject } from "react-router-dom";
import OutboxesView from ".";
import OutboxFeedView from "./outbox-feed";

export default [
  { index: true, Component: OutboxesView },
  { path: ":relay", Component: OutboxFeedView },
] satisfies RouteObject[];
