import { Button, Flex, MenuItem, Tab, TabList, TabPanel, TabPanels, Tabs, useDisclosure } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useMemo } from "react";

import { DotsMenuButton } from "../../../components/menu/dots-menu-button";
import SimpleView from "../../../components/layout/presets/simple-view";
import { parseNappletPointer } from "../../../helpers/nostr/napplets";
import useAsyncAction from "../../../hooks/use-async-action";
import useInstalledNapplets from "../../../hooks/use-installed-napplets";
import { useAppTitle } from "../../../hooks/use-app-title";
import useRouteSearchValue from "../../../hooks/use-route-search-value";
import { uninstallNapplet } from "../../../services/installed-napplets";
import { nappletSyncStatus$, syncInstalledNapplets } from "../../../services/napplet-sync";
import InstalledNappletCard from "../../napplets/components/installed-napplet-card";
import NappletPermissionsPanel from "../../napplets/components/napplet-permissions-panel";
import InstallPointerModal from "./install-pointer-modal";

const APPS_TABS = ["installed", "used"];

/** Header button for the sync states the user can act on */
function NappletSyncButton() {
  const status = use$(nappletSyncStatus$);
  const { loading, run } = useAsyncAction(syncInstalledNapplets, []);

  if (status !== "locked" && status !== "unsynced" && status !== "syncing") return null;

  return (
    <Button variant="ghost" colorScheme="primary" onClick={run} isLoading={loading || status === "syncing"}>
      {status === "locked" ? "Unlock" : "Sync"}
    </Button>
  );
}

export default function AppsSettings() {
  useAppTitle("Installed apps");
  const installed = useInstalledNapplets();
  const installModal = useDisclosure();
  const { value: tab, setValue: setTab } = useRouteSearchValue("tab", APPS_TABS[0]);

  // `pubkey:dTag` keys of installed napplets, so their grants are only shown on their own card
  const installedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const napplet of installed) {
      const decoded = parseNappletPointer(napplet.address);
      if (decoded?.type === "naddr") keys.add(`${decoded.data.pubkey}:${decoded.data.identifier}`);
    }
    return keys;
  }, [installed]);

  return (
    <SimpleView
      title="Installed apps"
      maxW="container.xl"
      gap="4"
      actions={
        <Flex gap="2" ms="auto">
          <NappletSyncButton />
          <DotsMenuButton aria-label="More options" variant="ghost">
            <MenuItem onClick={installModal.onOpen}>Install from naddr</MenuItem>
          </DotsMenuButton>
        </Flex>
      }
    >
      <Tabs
        isLazy
        colorScheme="primary"
        index={Math.max(APPS_TABS.indexOf(tab), 0)}
        onChange={(i) => setTab(APPS_TABS[i])}
      >
        <TabList>
          <Tab>Installed</Tab>
          <Tab>Used</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px="0" display="flex" flexDirection="column" gap="6">
            {installed.map((napplet) => (
              <InstalledNappletCard
                key={napplet.address}
                napplet={napplet}
                onUninstall={() => uninstallNapplet(napplet.address)}
              />
            ))}
          </TabPanel>
          <TabPanel px="0">
            <NappletPermissionsPanel exclude={installedKeys} />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <InstallPointerModal isOpen={installModal.isOpen} onClose={installModal.onClose} />
    </SimpleView>
  );
}
