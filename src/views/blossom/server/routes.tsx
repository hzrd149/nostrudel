import { InfoIcon } from "@chakra-ui/icons";
import { RouteObject } from "react-router-dom";

import BlossomServerFavicon from "../../../components/blossom/blossom-server-favicon";
import BlossomServerLink from "../../../components/blossom/blossom-server-link";
import Globe01 from "../../../components/icons/globe-01";
import ThumbsUp from "../../../components/icons/thumbs-up";
import SimpleHeader from "../../../components/layout/components/simple-header";
import AppTabsLayout, { AppTabs } from "../../../components/layout/presets/app-tabs-layout";
import { useAppTitle } from "../../../hooks/use-app-title";
import BlossomAboutView from "./tabs/about";
import BlossomHomepageView from "./tabs/homepage";
import BlossomReviewsView from "./tabs/reviews";
import useServerUrlParam from "./use-server-url-param";

export const blossomTabs: AppTabs[] = [
  { label: "About", path: "", icon: InfoIcon, Component: BlossomAboutView },
  { label: "Homepage", path: "homepage", icon: Globe01, Component: BlossomHomepageView },
  { label: "Reviews", path: "reviews", icon: ThumbsUp, Component: BlossomReviewsView },
];

function BlossomHeader() {
  const server = useServerUrlParam();

  return (
    <SimpleHeader
      title={<BlossomServerLink server={server} isTruncated />}
      icon={<BlossomServerFavicon server={server} size="sm" />}
    />
  );
}

function BlossomLayout() {
  const server = useServerUrlParam();
  useAppTitle(new URL(server).hostname);

  return <AppTabsLayout tabs={blossomTabs} header={<BlossomHeader />} />;
}

export default [
  {
    Component: BlossomLayout,
    children: blossomTabs,
  },
] satisfies RouteObject[];
