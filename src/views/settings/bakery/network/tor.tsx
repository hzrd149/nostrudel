import { ReactNode } from "react";
import { Flex, Heading, Link, Spinner } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import TorOutboundStatus from "./tor-outbound";
import TorInboundStatus from "./tor-inbound";
import useBakeryControl from "../../../../hooks/use-bakery-control";

export default function TorNetworkStatus() {
  const control = useBakeryControl();
  const config = useObservable(control?.config);
  const status = useObservable(control?.network);

  let content: ReactNode = null;

  if (status === undefined || config === undefined) content = <Spinner />;
  else {
    content = (
      <>
        <TorOutboundStatus />
        <TorInboundStatus />
      </>
    );
  }

  return (
    <>
      <Flex alignItems="center" gap="2">
        <Heading size="md">Tor</Heading>
        <Link isExternal href="https://www.torproject.org/" color="GrayText" ml="auto">
          More Info
        </Link>
      </Flex>
      {content}
    </>
  );
}
