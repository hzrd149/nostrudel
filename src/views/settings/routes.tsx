import { RouteObject } from "react-router-dom";
import RequireActiveAccount from "../../components/router/require-active-account";

import SettingsView from ".";
import AccountSettings from "./accounts";
import AuthenticationSettingsView from "./authentication";
import BackgroundWorkerSettings from "./background-worker";
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
import ContentPoliciesSettings from "./policies";
import MutesSettings from "./mutes";

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
      { path: "social-graph", Component: SocialGraphView },
      { path: "mutes", Component: MutesSettings },
      { path: "policies", Component: ContentPoliciesSettings },
      { path: "cache", Component: CacheRelayView },
      { path: "post", Component: PostSettings },
      { path: "privacy", Component: PrivacySettings },
      { path: "lightning", Component: LightningSettings },
      { path: "performance", Component: PerformanceSettings },
      { path: "background-worker", Component: BackgroundWorkerSettings },
    ],
  },
] satisfies RouteObject[];
