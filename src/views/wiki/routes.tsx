import { lazy } from "react";
import { RouteObject } from "react-router";

const WikiHomeView = lazy(() => import("."));
const WikiSearchView = lazy(() => import("./search"));
const WikiTopicView = lazy(() => import("./topic"));
const WikiPageView = lazy(() => import("./page"));
const EditWikiPageView = lazy(() => import("./edit"));
const WikiCompareView = lazy(() => import("./compare"));
const CreateWikiPageView = lazy(() => import("./create"));

export default [
  { index: true, element: <WikiHomeView /> },
  { path: "search", element: <WikiSearchView /> },
  { path: "topic/:topic", element: <WikiTopicView /> },
  { path: "page/:naddr", element: <WikiPageView /> },
  { path: "edit/:topic", element: <EditWikiPageView /> },
  { path: "compare/:topic/:a/:b", element: <WikiCompareView /> },
  { path: "create", element: <CreateWikiPageView /> },
] satisfies RouteObject[];
