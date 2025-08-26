import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const EmojisHomeView = lazy(() => import("."));
const EmojiPacksBrowseView = lazy(() => import("./browse"));
const EmojiPackView = lazy(() => import("./pack/index"));

export default [
  { index: true, Component: EmojisHomeView },
  { path: "browse", Component: EmojiPacksBrowseView },
  { path: ":addr", Component: EmojiPackView },
] satisfies RouteObject[];
