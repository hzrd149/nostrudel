import { lazy } from "react";
import { Outlet, RouteObject } from "react-router-dom";

import NotificationsView from "./index";
import RequireActiveAccount from "../../components/router/require-active-account";

// Lazy load tab components
const ThreadsTab = lazy(() => import("./threads"));
const MentionsTab = lazy(() => import("./mentions"));
const QuotesTab = lazy(() => import("./quotes"));
const RepostsTab = lazy(() => import("./reposts"));
const ZapsTab = lazy(() => import("./zaps"));

export default [
  {
    element: (
      <RequireActiveAccount>
        <Outlet />
      </RequireActiveAccount>
    ),
    children: [
      {
        index: true,
        element: <NotificationsView />,
      },
      {
        path: "threads",
        element: <ThreadsTab />,
      },
      {
        path: "mentions",
        element: <MentionsTab />,
      },
      {
        path: "quotes",
        element: <QuotesTab />,
      },
      {
        path: "reposts",
        element: <RepostsTab />,
      },
      {
        path: "zaps",
        element: <ZapsTab />,
      },
    ],
  },
] satisfies RouteObject[];
