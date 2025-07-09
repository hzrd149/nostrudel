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
import MessagesSettings from "./messages";
import MutesSettings from "./mutes";
import ContentPoliciesSettings from "./content";
import PostSettings from "./post";
import PrivacySettings from "./privacy";
import AppRelaysView from "./relays";
import SearchSettings from "./search";
import SocialGraphView from "./social-graph";
import ProfileSettingsView from "./profile";
import PerformanceSettings from "./performance";

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
      {
        path: "profile",
        element: (
          <RequireActiveAccount>
            <ProfileSettingsView />
          </RequireActiveAccount>
        ),
      },
      { path: "mailboxes", Component: MailboxesView },
      { path: "identity", Component: DnsIdentityView },
      { path: "authentication", Component: AuthenticationSettingsView },
      { path: "media-servers", Component: MediaServersView },
      { path: "search", Component: SearchSettings },
      { path: "relays", Component: AppRelaysView },
      { path: "social-graph", Component: SocialGraphView },
      { path: "mutes", Component: MutesSettings },
      { path: "content", Component: ContentPoliciesSettings },
      { path: "performance", Component: PerformanceSettings },
      { path: "cache", Component: CacheRelayView },
      { path: "post", Component: PostSettings },
      { path: "privacy", Component: PrivacySettings },
      { path: "lightning", Component: LightningSettings },
      { path: "messages", Component: MessagesSettings },
      { path: "background-worker", Component: BackgroundWorkerSettings },
    ],
  },
] satisfies RouteObject[];
