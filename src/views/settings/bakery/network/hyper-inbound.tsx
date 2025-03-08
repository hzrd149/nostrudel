import { Alert, AlertIcon } from "@chakra-ui/react";

import PanelItemString from "../../../../components/dashboard/panel-item-string";
import useBakeryControl from "../../../../hooks/use-bakery-control";
import { useObservable } from "applesauce-react/hooks";

export default function HyperInboundStatus() {
  const control = useBakeryControl();
  const status = useObservable(control?.network);

  if (status === undefined) return null;
  else if (!status.hyper.inbound.available) {
    return (
      <Alert status="info">
        <AlertIcon />
        Inbound connections from HyperDHT are not available
      </Alert>
    );
  } else if (!status.hyper.inbound.running) {
    if (status.hyper.inbound.error)
      return (
        <Alert status="error">
          <AlertIcon />
          HyperDHT node failed to start: {status.hyper.inbound.error}
        </Alert>
      );
    else
      return (
        <Alert status="loading">
          <AlertIcon />
          Starting HyperDHT node...
        </Alert>
      );
  } else
    return (
      <PanelItemString
        label="Hyper Address"
        value={status.hyper.inbound.address}
        isLoading={!status.hyper.inbound.address}
        qr
      />
    );
}
