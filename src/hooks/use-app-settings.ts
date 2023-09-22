import { useCallback } from "react";
import { useToast } from "@chakra-ui/react";

import appSettings, { replaceSettings } from "../services/settings/app-settings";
import useSubject from "./use-subject";
import { AppSettings } from "../services/settings/migrations";

export default function useAppSettings() {
  const settings = useSubject(appSettings);
  const toast = useToast();

  const updateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      try {
        return replaceSettings({ ...settings, ...newSettings });
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
    },
    [settings],
  );

  return {
    ...settings,
    updateSettings,
  };
}
