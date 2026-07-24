import { Button, Flex, Text } from "@chakra-ui/react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import SimpleView from "../../components/layout/presets/simple-view";
import { getInstalledNapplets, uninstallNapplet } from "../../services/installed-napplets";
import InstalledNappletCard from "./components/installed-napplet-card";

export default function NappletsView() {
  const [installed, setInstalled] = useState(() => getInstalledNapplets());

  const remove = (address: string) => {
    uninstallNapplet(address);
    setInstalled(getInstalledNapplets());
  };

  return (
    <SimpleView
      title="Napplets"
      actions={
        <Button as={RouterLink} to="/tools/napplets" colorScheme="primary" size="sm">
          Install napplet
        </Button>
      }
    >
      {installed.length === 0 ? (
        <Flex direction="column" gap="3" alignItems="flex-start">
          <Text color="GrayText">Installed NIP-5D napplets will appear here as local mini apps.</Text>
          <Button as={RouterLink} to="/tools/napplets" colorScheme="primary">
            Install your first napplet
          </Button>
        </Flex>
      ) : (
        <Flex direction="column" gap="2">
          {installed.map((napplet) => (
            <InstalledNappletCard
              key={napplet.address}
              napplet={napplet}
              onUninstall={() => remove(napplet.address)}
            />
          ))}
        </Flex>
      )}
    </SimpleView>
  );
}
