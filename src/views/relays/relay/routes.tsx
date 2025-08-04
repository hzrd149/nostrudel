import { InfoIcon } from "@chakra-ui/icons";
import { RouteObject } from "react-router-dom";

import { NotesIcon, SettingsIcon } from "../../../components/icons";
import Globe01 from "../../../components/icons/globe-01";
import ThumbsUp from "../../../components/icons/thumbs-up";
import Users01 from "../../../components/icons/users-01";
import SimpleHeader from "../../../components/layout/components/simple-header";
import AppTabsLayout, { AppTabs } from "../../../components/layout/presets/app-tabs-layout";
import RelayFavicon from "../../../components/relay/relay-favicon";
import RelayLink from "../../../components/relay/relay-link";
import { useAppTitle } from "../../../hooks/use-app-title";
import RelayAboutView from "./tabs/about";
import RelayAdvancedView from "./tabs/advanced";
import RelayNotesView from "./tabs/events";
import RelayHomepageView from "./tabs/homepage";
import RelayReviewsView from "./tabs/reviews";
import RelayUsersView from "./tabs/users";
import useRelayUrlParam from "./use-relay-url-param";

export const relayTabs: AppTabs[] = [
  { label: "About", path: "", icon: InfoIcon, Component: RelayAboutView },
  { label: "Notes", path: "notes", icon: NotesIcon, Component: RelayNotesView },
  { label: "Reviews", path: "reviews", icon: ThumbsUp, Component: RelayReviewsView },
  { label: "Users", path: "users", icon: Users01, Component: RelayUsersView },
  { label: "Homepage", path: "homepage", icon: Globe01, Component: RelayHomepageView },
  { label: "Advanced", path: "advanced", icon: SettingsIcon, Component: RelayAdvancedView },
];

function RelayHeader() {
  const relay = useRelayUrlParam();

  return (
    <SimpleHeader title={<RelayLink relay={relay} isTruncated />} icon={<RelayFavicon relay={relay} size="sm" />} />
  );
}

function RelayLayout() {
  const relay = useRelayUrlParam();
  useAppTitle(relay);

  return <AppTabsLayout tabs={relayTabs} header={<RelayHeader />} />;
}

export default [
  {
    Component: RelayLayout,
    children: relayTabs,
  },
] satisfies RouteObject[];
