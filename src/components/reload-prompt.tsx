import { useRegisterSW } from "virtual:pwa-register/react";
import { Alert, AlertIcon, AlertTitle, Button, CloseButton, useToast } from "@chakra-ui/react";

// check for updates every hour
const intervalMS = 60 * 60 * 1000;

export const ReloadPrompt = () => {
  const toast = useToast();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered: " + r);
      toast({ variant: "success", title: "Installed" });

      if (r) {
        setInterval(() => r.update(), intervalMS);
      }
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  return needRefresh ? (
    <Alert status="success" flexShrink={0}>
      <AlertIcon />
      <AlertTitle>New update ready!</AlertTitle>
      <Button size="sm" ml="auto" onClick={() => updateServiceWorker(true)}>
        Refresh
      </Button>
      <CloseButton ml="4" onClick={close} />
    </Alert>
  ) : null;
};
