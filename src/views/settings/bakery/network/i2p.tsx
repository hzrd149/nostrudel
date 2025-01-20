import { ReactNode } from "react";
import { Flex, Heading, Link, Spinner } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import I2POutboundStatus from "./i2p-outbound";
import I2PInboundStatus from "./i2p-inbound";
import { controlApi$ } from "../../../../services/bakery";
import useNetworkOverviewReport from "../../../../hooks/reports/use-network-status-report";

export default function I2PNetworkStatus() {
  const controlApi = useObservable(controlApi$);
  const config = useObservable(controlApi?.config);
  const status = useNetworkOverviewReport();

  let content: ReactNode = null;

  if (status === undefined || config === undefined) content = <Spinner />;
  else {
    content = (
      <>
        <I2POutboundStatus />
        <I2PInboundStatus />
      </>
    );
  }

  return (
    <>
      <Flex alignItems="center" gap="2">
        <Heading size="md">I2P</Heading>
        <Link isExternal href="https://geti2p.net/en/" color="GrayText" ml="auto">
          More Info
        </Link>
      </Flex>
      {content}
    </>
  );
}
