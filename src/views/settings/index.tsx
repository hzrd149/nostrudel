import { Button, Flex, Accordion, Link } from "@chakra-ui/react";
import accountService from "../../services/account";
import { GithubIcon, LogoutIcon } from "../../components/icons";
import LightningSettings from "./lightning-settings";
import DatabaseSettings from "./database-settings";
import DisplaySettings from "./display-settings";
import PerformanceSettings from "./performance-settings";

export default function SettingsView() {
  return (
    <Flex direction="column" pt="2" pb="2" overflow="auto">
      <Accordion defaultIndex={[0]} allowMultiple>
        <DisplaySettings />

        <PerformanceSettings />

        <LightningSettings />

        <DatabaseSettings />
      </Accordion>
      <Flex gap="2" padding="4" alignItems="center" justifyContent="space-between">
        <Button leftIcon={<LogoutIcon />} onClick={() => accountService.logout()}>
          Logout
        </Button>
        <Link isExternal href="https://github.com/hzrd149/nostrudel">
          <GithubIcon /> Github
        </Link>
      </Flex>
    </Flex>
  );
}
