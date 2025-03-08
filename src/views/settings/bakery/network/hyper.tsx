import { ReactNode } from "react";
import { Alert, Button, Code, Flex, Heading, Link, Spinner, Switch } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import HyperInboundStatus from "./hyper-inbound";
import HyperOutboundStatus from "./hyper-outbound";
import useBakeryControl from "../../../../hooks/use-bakery-control";

export default function HyperNetworkStatus() {
  const control = useBakeryControl();
  const config = useObservable(control?.config);
  const status = useObservable(control?.network);

  let content: ReactNode = null;

  if (status === undefined || config === undefined) content = <Spinner />;
  else if (!config.hyperEnabled) {
    content = (
      <Alert status="info" whiteSpace="pre-wrap">
        Enable HyperDHT in order to connect to <Code>.hyper</Code> relays
        <Button variant="ghost" onClick={() => control?.setConfigField("hyperEnabled", true)} ml="auto">
          Enable
        </Button>
      </Alert>
    );
  } else
    content = (
      <>
        <HyperOutboundStatus />
        <HyperInboundStatus />
      </>
    );

  return (
    <>
      <Flex alignItems="center" gap="2">
        <Heading size="md">HyperDHT</Heading>
        {config !== undefined && (
          <Switch
            isChecked={config?.hyperEnabled}
            onChange={(e) => control?.setConfigField("hyperEnabled", e.currentTarget.checked)}
          >
            Enabled
          </Switch>
        )}
        <Link isExternal href="https://docs.pears.com/building-blocks/hyperdht" color="GrayText" ml="auto">
          More Info
        </Link>
      </Flex>
      {content}
    </>
  );
}
