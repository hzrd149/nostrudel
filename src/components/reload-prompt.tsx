import { useRegisterSW } from "virtual:pwa-register/react";
import { Alert, AlertIcon, AlertProps, AlertTitle, Button, CloseButton, useToast } from "@chakra-ui/react";

// check for updates every hour
const intervalMS = 60 * 60 * 1000;

export function ReloadPrompt(props: Omit<AlertProps, "children" | "status">) {
  const toast = useToast();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (!r) return;

      setInterval(() => r.update(), intervalMS);
    },
    onOfflineReady() {
      toast({ status: "success", title: "App Installed", duration: 2000, isClosable: true });
    },
    onRegisterError(error) {
      console.log("SW registration error");
      console.log(error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  return needRefresh ? (
    <Alert status="success" {...props}>
      <AlertIcon />
      <AlertTitle>New update ready!</AlertTitle>
      <Button size="sm" ml="auto" onClick={() => updateServiceWorker(true)}>
        Refresh
      </Button>
      <CloseButton ml="4" onClick={close} />
    </Alert>
  ) : null;
}
