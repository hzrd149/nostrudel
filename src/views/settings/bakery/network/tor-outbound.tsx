import { ReactNode } from "react";
import { Alert, AlertIcon, FormControl, FormHelperText, Switch } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import useBakeryControl from "../../../../hooks/use-bakery-control";

export default function TorOutboundStatus() {
  const control = useBakeryControl();
  const config = useObservable(control?.config);
  const status = useObservable(control?.network);

  let content: ReactNode = null;
  if (status === undefined) content = null;
  else if (!status.tor.outbound.available) {
    content = (
      <Alert status="warning">
        <AlertIcon />
        Outbound connections to Tor are not available
      </Alert>
    );
  } else if (status.tor.outbound.error) {
    content = (
      <Alert status="loading">
        <AlertIcon />
        Testing Tor proxy...
      </Alert>
    );
  } else if (!status.tor.outbound.running && config?.enableTorConnections) {
    content = (
      <Alert status="error">
        <AlertIcon />
        Tor proxy failed: {status.tor.outbound.error}
      </Alert>
    );
  }

  return (
    <>
      {status?.tor.outbound.available && (
        <FormControl>
          <Switch
            isChecked={config?.enableTorConnections}
            onChange={(e) => control?.setConfigField("enableTorConnections", e.currentTarget.checked)}
          >
            Connect to tor relays
          </Switch>
          <FormHelperText>Allows the node to connect to .onion domains</FormHelperText>
        </FormControl>
      )}
      {status?.tor.outbound.available && (
        <FormControl>
          <Switch
            isChecked={config?.routeAllTrafficThroughTor}
            onChange={(e) => control?.setConfigField("routeAllTrafficThroughTor", e.currentTarget.checked)}
          >
            Route all traffic through tor proxy
          </Switch>
          <FormHelperText>
            Routes all WebSocket and HTTP traffic through tor proxy. (This only applies to connections made by the node)
          </FormHelperText>
        </FormControl>
      )}
      {content}
    </>
  );
}
