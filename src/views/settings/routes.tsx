import { lazy } from "react";
import { Outlet, RouteObject } from "react-router";

const SettingsView = lazy(() => import("."));
const DisplaySettings = lazy(() => import("./display"));
const RequireCurrentAccount = lazy(() => import("../../components/router/require-current-account"));
const AccountSettings = lazy(() => import("./accounts"));
const MailboxesView = lazy(() => import("../relays/mailboxes"));
const MediaServersView = lazy(() => import("./media-servers"));
const SearchRelaysView = lazy(() => import("../relays/search"));
const AppRelaysView = lazy(() => import("../relays/app"));
const CacheRelayView = lazy(() => import("../relays/cache"));
const PostSettings = lazy(() => import("./post"));
const PrivacySettings = lazy(() => import("./privacy"));
const LightningSettings = lazy(() => import("./lightning"));
const PerformanceSettings = lazy(() => import("./performance"));
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
          <RequireCurrentAccount>
            <AccountSettings />
          </RequireCurrentAccount>
        ),
      },
      { path: "mailboxes", Component: MailboxesView },
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
