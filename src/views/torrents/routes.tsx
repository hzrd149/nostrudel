import { lazy } from "react";
import { RouteObject } from "react-router";

const TorrentsView = lazy(() => import("."));
const NewTorrentView = lazy(() => import("./new"));
const TorrentDetailsView = lazy(() => import("./torrent"));

export default [
  { index: true, Component: TorrentsView },
  { path: "new", Component: NewTorrentView },
  { path: ":id", Component: TorrentDetailsView },
] satisfies RouteObject[];
