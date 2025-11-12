import { Box, Heading, Input, SimpleGrid, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { useState } from "react";

import { allApps, App, externalTools, internalTools } from "../../components/navigation/apps";
import SimpleNavBox from "../../components/layout/box-layout/simple-nav-box";
import SimpleView from "../../components/layout/presets/simple-view";
import AppFavoriteButton from "../../components/navigation/app-favorite-button";
import useRecentIds from "../../hooks/use-recent-ids";
import useRouteSearchValue from "../../hooks/use-route-search-value";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import { AppIcon } from "./component/app-card";

const tabs = ["all", "tools", "3rd-party-tools"];

function AppRow({ app, canFavorite = true, onUse }: { app: App; canFavorite?: boolean; onUse: (id: string) => void }) {
  return (
    <SimpleNavBox
      icon={<AppIcon app={app} size="14" />}
      title={app.title}
      description={app.description}
      to={app.isExternal ? undefined : app.to}
      href={app.isExternal && typeof app.to === "string" ? app.to : undefined}
      onClick={() => onUse(app.id)}
      actions={canFavorite ? <AppFavoriteButton app={app} variant="ghost" /> : undefined}
    />
  );
}

export default function OtherStuffView() {
  const [search, setSearch] = useState("");
  const tab = useRouteSearchValue("tab", "all");
  const { recent: recentApps, useThing: useApp } = useRecentIds("apps");
  const autoFocusSearch = useBreakpointValue({ base: false, lg: true });

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
              <AppRow key={app.id} app={app} onUse={useApp} />
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
                  <AppRow key={app.id} app={app} canFavorite={!externalTools.includes(app)} onUse={useApp} />
                ) : null;
              })}
            </SimpleGrid>
          </>
        )}

        <Tabs
          mt="4"
          variant="soft-rounded"
          colorScheme="primary"
          index={tabs.indexOf(tab.value)}
          onChange={(v) => tab.setValue(tabs[v])}
        >
          <TabList gap="2" px="4">
            <Tab>All</Tab>
            <Tab>Tools</Tab>
            <Tab>3rd Party Tools</Tab>
          </TabList>
          <TabPanels>
            <TabPanel as={SimpleGrid} columns={columns} px="0" py="0" borderTopWidth={1}>
              {allApps.sort(sortByName).map((app) => (
                <AppRow key={app.id} app={app} canFavorite={!externalTools.includes(app)} onUse={useApp} />
              ))}
            </TabPanel>
            <TabPanel as={SimpleGrid} columns={columns} px="0" py="0" borderTopWidth={1}>
              {internalTools.sort(sortByName).map((app) => (
                <AppRow key={app.id} app={app} onUse={useApp} />
              ))}
            </TabPanel>
            <TabPanel as={SimpleGrid} columns={columns} px="0" py="0" borderTopWidth={1}>
              {externalTools.sort(sortByName).map((app) => (
                <AppRow key={app.id} app={app} canFavorite={false} onUse={useApp} />
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
