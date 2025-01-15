import { ReactNode } from "react";
import { Alert, Button, Code, Flex, Heading, Link, Spinner, Switch } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import useNetworkOverviewReport from "../../../../../hooks/reports/use-network-status-report";
import HyperInboundStatus from "./hyper-inbound";
import HyperOutboundStatus from "./hyper-outbound";
import { controlApi } from "../../../../../services/bakery";

export default function HyperNetworkStatus() {
  const config = useObservable(controlApi?.config);
  const status = useNetworkOverviewReport();

  let content: ReactNode = null;

  if (status === undefined || config === undefined) content = <Spinner />;
  else if (!config.hyperEnabled) {
    content = (
      <Alert status="info" whiteSpace="pre-wrap">
        Enable HyperDHT in order to connect to <Code>.hyper</Code> relays
        <Button
          variant="ghost"
          onClick={() => controlApi?.send(["CONTROL", "CONFIG", "SET", "hyperEnabled", true])}
          ml="auto"
        >
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
            onChange={(e) => controlApi?.send(["CONTROL", "CONFIG", "SET", "hyperEnabled", e.currentTarget.checked])}
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
