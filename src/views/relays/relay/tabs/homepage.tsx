import { useMemo } from "react";
import useRelayUrlParam from "../use-relay-url-param";
import { Box } from "@chakra-ui/react";

export default function RelayHomepageView() {
  const relay = useRelayUrlParam();
  const url = useMemo(() => {
    const url = new URL(relay);
    url.protocol = url.protocol === "wss:" ? "https:" : "http:";
    return url.toString();
  }, [relay]);

  return <Box as="iframe" src={url} w="full" h="full" p="0" border="none" />;
}
