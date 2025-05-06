import { RouteObject } from "react-router-dom";
import RequireActiveAccount from "../../components/router/require-active-account";

import SettingsView from ".";
import AccountSettings from "./accounts";
import AuthenticationSettingsView from "./authentication";
import CacheRelayView from "./cache";
import DisplaySettings from "./display";
import DnsIdentityView from "./dns-identity";
import LightningSettings from "./lightning";
import MailboxesView from "./mailboxes";
import MediaServersView from "./media-servers";
import PerformanceSettings from "./performance";
import PostSettings from "./post";
import PrivacySettings from "./privacy";
import AppRelaysView from "./relays";
import SearchRelaysView from "./search";
import SocialGraphView from "./social-graph";

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
      { path: "identity", Component: DnsIdentityView },
      { path: "authentication", Component: AuthenticationSettingsView },
      { path: "media-servers", Component: MediaServersView },
      { path: "search-relays", Component: SearchRelaysView },
      { path: "relays", Component: AppRelaysView },
      { path: "cache", Component: CacheRelayView },
      { path: "post", Component: PostSettings },
      { path: "privacy", Component: PrivacySettings },
      { path: "lightning", Component: LightningSettings },
      { path: "performance", Component: PerformanceSettings },
      { path: "social-graph", Component: SocialGraphView },
    ],
  },
] satisfies RouteObject[];
