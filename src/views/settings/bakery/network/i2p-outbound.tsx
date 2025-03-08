import { ReactNode } from "react";
import { Alert, AlertIcon, FormControl, FormHelperText, Switch } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import useBakeryControl from "../../../../hooks/use-bakery-control";

export default function I2POutboundStatus() {
  const control = useBakeryControl();
  const config = useObservable(control?.config);
  const status = useObservable(control?.network);

  let content: ReactNode = null;
  if (status === undefined) content = null;
  else if (!status.i2p.outbound.available) {
    content = (
      <Alert status="warning">
        <AlertIcon />
        Outbound connections to I2P are not available
      </Alert>
    );
  } else if (status.i2p.outbound.error) {
    content = (
      <Alert status="loading">
        <AlertIcon />
        Testing I2P proxy...
      </Alert>
    );
  } else if (!status.i2p.outbound.running && config?.enableI2PConnections) {
    content = (
      <Alert status="error">
        <AlertIcon />
        I2P proxy failed: {status.i2p.outbound.error}
      </Alert>
    );
  }

  return (
    <>
      {status?.i2p.outbound.available && (
        <FormControl>
          <Switch
            isChecked={config?.enableI2PConnections}
            onChange={(e) => control?.setConfigField("enableI2PConnections", e.currentTarget.checked)}
          >
            Connect to i2p relays
          </Switch>
          <FormHelperText>Allows the node to connect to .i2p domains</FormHelperText>
        </FormControl>
      )}
      {content}
    </>
  );
}
