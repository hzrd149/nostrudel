import { lazy } from "react";
import { Outlet, RouteObject } from "react-router-dom";
import RequireActiveAccount from "../../components/router/require-active-account";

import SettingsView from ".";
import DisplaySettings from "./display";
import AccountSettings from "./accounts";
import MailboxesView from "./mailboxes";
import MediaServersView from "./media-servers";
import SearchRelaysView from "./search";
import AppRelaysView from "./relays";
import CacheRelayView from "./cache";
import PostSettings from "./post";
import PrivacySettings from "./privacy";
import LightningSettings from "./lightning";
import PerformanceSettings from "./performance";
import AuthenticationSettingsView from "./authentication";

// bakery settings
const BakeryConnectView = lazy(() => import("./bakery/connect"));
const RequireBakery = lazy(() => import("../../components/router/require-bakery"));
const BakeryGeneralSettingsView = lazy(() => import("./bakery/general-settings"));
const BakeryAuthView = lazy(() => import("./bakery/connect/auth"));
const NotificationSettingsView = lazy(() => import("./bakery/notifications"));
const RequireBakeryAuth = lazy(() => import("../../components/router/require-bakery-auth"));
const BakeryNetworkSettingsView = lazy(() => import("./bakery/network"));
const BakeryServiceLogsView = lazy(() => import("./bakery/service-logs"));

export default [
  {
    element: <SettingsView />,
    children: [
      { index: true, Component: DisplaySettings },
      { path: "display", Component: DisplaySettings },
      {
        path: "accounts",
        element: (
          <RequireActiveAccount>
            <AccountSettings />
          </RequireActiveAccount>
        ),
      },
      { path: "mailboxes", Component: MailboxesView },
      { path: "authentication", Component: AuthenticationSettingsView },
      { path: "media-servers", Component: MediaServersView },
      { path: "search-relays", Component: SearchRelaysView },
      { path: "relays", Component: AppRelaysView },
      { path: "cache", Component: CacheRelayView },
      { path: "post", Component: PostSettings },
      { path: "privacy", Component: PrivacySettings },
      { path: "lightning", Component: LightningSettings },
      { path: "performance", Component: PerformanceSettings },

      { path: "bakery/connect", Component: BakeryConnectView },
      {
        path: "bakery",
        element: (
          <RequireBakery>
            <Outlet />
          </RequireBakery>
        ),
        children: [
          { index: true, Component: BakeryGeneralSettingsView },
          { path: "auth", Component: BakeryAuthView },
          { path: "notifications", Component: NotificationSettingsView },
          {
            path: "network",
            element: (
              <RequireBakeryAuth>
                <BakeryNetworkSettingsView />
              </RequireBakeryAuth>
            ),
          },
          { path: "logs", Component: BakeryServiceLogsView },
        ],
      },
    ],
  },
] satisfies RouteObject[];
