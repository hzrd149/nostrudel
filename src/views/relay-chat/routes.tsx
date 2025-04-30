import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const RelayChatHomeView = lazy(() => import("./index"));
const RelayChatRelayView = lazy(() => import("./relay"));

export default [
  {
    children: [
      { path: ":relay", Component: RelayChatRelayView },
      { index: true, Component: RelayChatHomeView },
    ],
  },
] satisfies RouteObject[];
