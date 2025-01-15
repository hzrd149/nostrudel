import { Alert, AlertIcon, Spinner } from "@chakra-ui/react";

import useNetworkOverviewReport from "../../../../hooks/reports/use-network-status-report";
import PanelItemString from "../../../../components/dashboard/panel-item-string";

export default function TorInboundStatus() {
  const status = useNetworkOverviewReport();

  if (status === undefined) return <Spinner />;
  else if (!status.tor.inbound.available) {
    return (
      <Alert status="info">
        <AlertIcon />
        Inbound connections from Tor are not available
      </Alert>
    );
  } else if (!status.tor.inbound.running) {
    if (status.tor.inbound.error)
      return (
        <Alert status="error">
          <AlertIcon />
          Tor hidden service failed: {status.tor.inbound.error}
        </Alert>
      );
    else
      return (
        <Alert status="loading">
          <AlertIcon />
          Start tor hidden service...
        </Alert>
      );
  } else return <PanelItemString label="Onion Address" value={status.tor.inbound.address ?? "Loading..."} qr />;
}
