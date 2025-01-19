import { RouteObject } from "react-router-dom";
import TorrentsView from ".";
import NewTorrentView from "./new";
import TorrentDetailsView from "./torrent";

export default [
  { index: true, Component: TorrentsView },
  { path: "new", Component: NewTorrentView },
  { path: ":id", Component: TorrentDetailsView },
] satisfies RouteObject[];
