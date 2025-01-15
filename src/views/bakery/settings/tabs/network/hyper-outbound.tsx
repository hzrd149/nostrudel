import { ReactNode } from "react";
import { Alert, AlertIcon, FormControl, FormHelperText, Switch } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import useNetworkOverviewReport from "../../../../../hooks/reports/use-network-status-report";
import { controlApi } from "../../../../../services/bakery";

export default function HyperOutboundStatus() {
  const config = useObservable(controlApi?.config);
  const status = useNetworkOverviewReport();

  let content: ReactNode = null;
  if (status === undefined) content = null;
  else if (!status.hyper.outbound.available) {
    content = (
      <Alert status="warning">
        <AlertIcon />
        Outbound connections to HyperDHT node are not available
      </Alert>
    );
  } else if (status.hyper.outbound.error) {
    content = (
      <Alert status="error">
        <AlertIcon />
        HyperDHT proxy failed to start: {status.hyper.outbound.error}
      </Alert>
    );
  } else if (!status.hyper.outbound.running && config?.enableHyperConnections) {
    content = (
      <Alert status="loading">
        <AlertIcon />
        Starting HyperDHT proxy...
      </Alert>
    );
  }

  return (
    <>
      <FormControl>
        <Switch
          isChecked={config?.enableHyperConnections}
          onChange={(e) =>
            controlApi?.send(["CONTROL", "CONFIG", "SET", "enableHyperConnections", e.currentTarget.checked])
          }
        >
          Connect to hyper relays
        </Switch>
        <FormHelperText>Allows the node to connect to .hyper domains</FormHelperText>
      </FormControl>
      {content}
    </>
  );
}
