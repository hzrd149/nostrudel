import { lazy } from "react";
import { RouteObject } from "react-router";

const ArticlesHomeView = lazy(() => import("."));
const ArticleView = lazy(() => import("./article"));

export default [
  { index: true, Component: ArticlesHomeView },
  { path: ":naddr", Component: ArticleView },
] satisfies RouteObject[];
