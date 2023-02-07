import { useRegisterSW } from "virtual:pwa-register/react";
import { Alert, AlertIcon, AlertTitle, Button } from "@chakra-ui/react";

export const ReloadPrompt = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered: " + r);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return offlineReady || needRefresh ? (
    <Alert status="success">
      <AlertIcon />
      <AlertTitle>New update ready!</AlertTitle>
      <Button size="sm" ml="auto" onClick={() => updateServiceWorker(true)}>
        Refresh
      </Button>
    </Alert>
  ) : null;
};
