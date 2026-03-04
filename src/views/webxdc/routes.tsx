import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const WebxdcView = lazy(() => import("."));
const WebxdcAppView = lazy(() => import("./app"));
const NewWebxdcView = lazy(() => import("./new"));

export default [
  { index: true, element: <WebxdcView /> },
  { path: "new", element: <NewWebxdcView /> },
  { path: ":nevent", element: <WebxdcAppView /> },
] satisfies RouteObject[];
