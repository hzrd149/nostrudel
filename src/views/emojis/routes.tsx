import { lazy } from "react";
import { RouteObject } from "react-router";

const EmojisHomeView = lazy(() => import("."));
const EmojiPacksBrowseView = lazy(() => import("./browse"));
const EmojiPackView = lazy(() => import("./emoji-pack"));

export default [
  { index: true, Component: EmojisHomeView },
  { path: "browse", Component: EmojiPacksBrowseView },
  { path: ":addr", Component: EmojiPackView },
] satisfies RouteObject[];
