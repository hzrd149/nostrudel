import { Button, Flex, Heading } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { ToolsIcon } from "../../components/icons";

export default function ToolsHomeView() {
  return (
    <Flex direction="column" gap="4" p="4">
      <Heading>
        <ToolsIcon /> Tools
      </Heading>
      <Flex wrap="wrap">
        <Button as={RouterLink} to="./nip19">
          Nip-19 encode/decode
        </Button>
      </Flex>
    </Flex>
  );
}
