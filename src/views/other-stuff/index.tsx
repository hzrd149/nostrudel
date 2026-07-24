import { Box, Heading, Input, SimpleGrid, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { useMemo, useState } from "react";

import { allApps as staticApps, App, internalTools } from "../../components/navigation/apps";
import SimpleNavBox from "../../components/layout/box-layout/simple-nav-box";
import SimpleView from "../../components/layout/presets/simple-view";
import AppFavoriteButton from "../../components/navigation/app-favorite-button";
import PuzzlePiece01 from "../../components/icons/puzzle-piece-01";
import useRecentIds from "../../hooks/use-recent-ids";
import useRouteSearchValue from "../../hooks/use-route-search-value";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import { getInstalledNappletPath, getInstalledNapplets } from "../../services/installed-napplets";
import { AppIcon } from "./component/app-card";

const tabs = ["all", "tools"];

function AppRow({ app, canFavorite = true, onUse }: { app: App; canFavorite?: boolean; onUse: (id: string) => void }) {
  return (
    <SimpleNavBox
      icon={<AppIcon app={app} size="14" />}
      title={app.title}
      description={app.description}
      to={app.to}
      onClick={() => onUse(app.id)}
      actions={canFavorite ? <AppFavoriteButton app={app} variant="ghost" /> : undefined}
    />
  );
}

function canFavoriteApp(app: App) {
  return !app.id.startsWith("napplet:");
}

export default function OtherStuffView() {
  const [search, setSearch] = useState("");
  const tab = useRouteSearchValue("tab", "all");
  const { recent: recentApps, useThing: useApp } = useRecentIds("apps");
  const autoFocusSearch = useBreakpointValue({ base: false, lg: true });
  const installedNappletApps = useMemo<App[]>(
    () =>
      getInstalledNapplets().map((napplet) => ({
        id: `napplet:${napplet.address}`,
        title: napplet.title,
        description: napplet.description || "Installed NIP-5D napplet",
        icon: PuzzlePiece01,
        to: getInstalledNappletPath(napplet),
      })),
    [],
  );
  const allApps = useMemo(() => [...staticApps, ...installedNappletApps], [installedNappletApps]);

  const columns = { base: 1, lg: 2, xl: 3, "2xl": 4 };

  const sortByName = (a: App, b: App) => {
    if (a.title === b.title) return 0;
    else if (a.title > b.title) return 1;
    else return -1;
  };

  const renderContent = () => {
    if (search.length > 0)
      return (
        <SimpleGrid columns={columns} borderTopWidth={1}>
          {allApps
            .filter(
              (app) =>
                app.title.toLowerCase().includes(search.toLowerCase()) ||
                app.description.toLowerCase().includes(search.toLowerCase()),
            )
            .map((app) => (
              <AppRow key={app.id} app={app} canFavorite={canFavoriteApp(app)} onUse={useApp} />
            ))}
        </SimpleGrid>
      );

    return (
      <>
        {recentApps.length > 0 && (
          <>
            <Box p="4">
              <Heading size="lg">Recently Used</Heading>
            </Box>
            <SimpleGrid columns={columns} borderTopWidth={1}>
              {recentApps.slice(0, 6).map((id) => {
                const app = allApps.find((a) => a.id === id);
                return app ? (
                  <AppRow key={app.id} app={app} canFavorite={canFavoriteApp(app)} onUse={useApp} />
                ) : null;
              })}
            </SimpleGrid>
          </>
        )}

        <Tabs
          mt="4"
          variant="soft-rounded"
          colorScheme="primary"
          index={tabs.includes(tab.value) ? tabs.indexOf(tab.value) : 0}
          onChange={(v) => tab.setValue(tabs[v])}
        >
          <TabList gap="2" px="4">
            <Tab>All</Tab>
            <Tab>Tools</Tab>
          </TabList>
          <TabPanels>
            <TabPanel as={SimpleGrid} columns={columns} px="0" py="0" borderTopWidth={1}>
              {allApps.sort(sortByName).map((app) => (
                <AppRow key={app.id} app={app} canFavorite={canFavoriteApp(app)} onUse={useApp} />
              ))}
            </TabPanel>
            <TabPanel as={SimpleGrid} columns={columns} px="0" py="0" borderTopWidth={1}>
              {internalTools.sort(sortByName).map((app) => (
                <AppRow key={app.id} app={app} onUse={useApp} />
              ))}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </>
    );
  };

  return (
    <SimpleView title="Tools and other stuff" flush gap={0}>
      <Box p="4">
        <Input
          type="search"
          placeholder="Search apps"
          maxW="sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus={autoFocusSearch}
        />
      </Box>

      {renderContent()}
    </SimpleView>
  );
}
