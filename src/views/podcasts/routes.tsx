import { lazy } from "react";
import { RouteObject } from "react-router";
import RequireCurrentAccount from "../../components/router/require-current-account";

const PodcastsHomeView = lazy(() => import("."));
const PodcastView = lazy(() => import("./podcast"));
const EpisodeView = lazy(() => import("./podcast/episode"));

export default [
  {
    index: true,
    element: (
      <RequireCurrentAccount>
        <PodcastsHomeView />
      </RequireCurrentAccount>
    ),
  },
  { path: ":guid", Component: PodcastView },
  { path: ":guid/:episode", Component: EpisodeView },
] satisfies RouteObject[];
