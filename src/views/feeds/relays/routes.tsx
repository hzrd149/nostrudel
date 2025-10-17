import { RouteObject } from "react-router-dom";
import RelaysView from ".";
import RelayFeedView from "./relay-feed";

export default [
  { index: true, Component: RelaysView },
  { path: ":relay", Component: RelayFeedView },
] satisfies RouteObject[];
