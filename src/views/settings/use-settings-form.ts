import { useToast } from "@chakra-ui/react";
import useAppSettings from "../../hooks/use-app-settings";
import { useForm } from "react-hook-form";

export default function useSettingsForm() {
  const toast = useToast();
  const { updateSettings, ...settings } = useAppSettings();

  const form = useForm({
    mode: "all",
    values: settings,
    resetOptions: {
      keepDirty: true,
    },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await updateSettings(values);
      toast({ title: "Settings saved", status: "success" });
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  });

  return { ...form, submit };
}
