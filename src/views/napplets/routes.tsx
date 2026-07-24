import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const NappletsView = lazy(() => import("."));
const NappletView = lazy(() => import("./napplet"));

export default [
  { index: true, Component: NappletsView },
  { path: ":address", Component: NappletView },
] satisfies RouteObject[];
