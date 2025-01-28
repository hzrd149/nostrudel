import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import RequireActiveAccount from "../../components/router/require-active-account";

const PodcastsHomeView = lazy(() => import("."));
const PodcastView = lazy(() => import("./podcast"));
const EpisodeView = lazy(() => import("./podcast/episode"));

export default [
  {
    index: true,
    element: (
      <RequireActiveAccount>
        <PodcastsHomeView />
      </RequireActiveAccount>
    ),
  },
  { path: ":guid", Component: PodcastView },
  { path: ":guid/:episode", Component: EpisodeView },
] satisfies RouteObject[];
