import { Button, Flex, Accordion, Link, useToast } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { GithubIcon, ToolsIcon } from "../../components/icons";
import LightningSettings from "./lightning-settings";
import DatabaseSettings from "./database-settings";
import DisplaySettings from "./display-settings";
import PerformanceSettings from "./performance-settings";
import PrivacySettings from "./privacy-settings";
import useAppSettings from "../../hooks/use-app-settings";
import { FormProvider, useForm } from "react-hook-form";

export default function SettingsView() {
  const toast = useToast();
  const { updateSettings, ...settings } = useAppSettings();

  const form = useForm({
    mode: "all",
    values: settings,
    resetOptions: {
      keepDirty: true,
    },
  });

  const saveSettings = form.handleSubmit(async (values) => {
    try {
      await updateSettings(values);
      toast({ title: "Settings saved", status: "success" });
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  });

  return (
    <Flex direction="column" pt="2" pb="2">
      <form onSubmit={saveSettings}>
        <FormProvider {...form}>
          <Accordion defaultIndex={[0]} allowMultiple>
            <DisplaySettings />
            <PerformanceSettings />
            <PrivacySettings />
            <LightningSettings />
            <DatabaseSettings />
          </Accordion>
        </FormProvider>
        <Flex gap="4" padding="4" alignItems="center">
          <Link isExternal href="https://github.com/hzrd149/nostrudel">
            <GithubIcon /> Github
          </Link>
          <Button
            ml="auto"
            isLoading={form.formState.isLoading || form.formState.isValidating || form.formState.isSubmitting}
            isDisabled={!form.formState.isDirty}
            colorScheme="brand"
            type="submit"
          >
            Save Settings
          </Button>
        </Flex>
      </form>
    </Flex>
  );
}
