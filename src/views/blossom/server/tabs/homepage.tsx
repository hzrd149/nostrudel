import { Box } from "@chakra-ui/react";
import useServerUrlParam from "../use-server-url-param";

export default function BlossomHomepageView() {
  const server = useServerUrlParam();

  return <Box as="iframe" src={server} w="full" h="full" p="0" border="none" />;
}
