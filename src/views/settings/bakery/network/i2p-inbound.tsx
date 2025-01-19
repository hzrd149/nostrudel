import { Alert, AlertIcon, Spinner } from "@chakra-ui/react";

import useNetworkOverviewReport from "../../../../hooks/reports/use-network-status-report";
import PanelItemString from "../../../../components/dashboard/panel-item-string";

export default function I2PInboundStatus() {
  const status = useNetworkOverviewReport();

  if (status === undefined) return <Spinner />;
  else if (!status.i2p.inbound.available) {
    return (
      <Alert status="info">
        <AlertIcon />
        Inbound connections from I2P are not available
      </Alert>
    );
  } else if (!status.i2p.inbound.running) {
    if (status.i2p.inbound.error)
      return (
        <Alert status="error">
          <AlertIcon />
          I2P tunnel failed: {status.i2p.inbound.error}
        </Alert>
      );
    else
      return (
        <Alert status="loading">
          <AlertIcon />
          Start I2P tunnel...
        </Alert>
      );
  } else
    return (
      <PanelItemString
        label="I2P Address"
        value={status.i2p.inbound.address}
        isLoading={!status.i2p.inbound.address}
        qr
      />
    );
}
