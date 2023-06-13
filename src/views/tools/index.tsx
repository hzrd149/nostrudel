import { Avatar, Button, Flex, Heading, Image, Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { ExternalLinkIcon, ToolsIcon } from "../../components/icons";

export default function ToolsHomeView() {
  return (
    <Flex direction="column" gap="4" p="4">
      <Heading>
        <ToolsIcon /> Tools
      </Heading>
      <Flex wrap="wrap" gap="4">
        <Button
          as={Link}
          href="https://nak.nostr.com/"
          isExternal
          target="_blank"
          leftIcon={<Image src="https://nak.nostr.com/favicon.ico" h="1.5em" />}
        >
          nostr army knife
        </Button>
        <Button
          as={Link}
          href="https://nostr-delete.vercel.app/"
          isExternal
          target="_blank"
          leftIcon={<ExternalLinkIcon />}
        >
          Nostr Event Deletion
        </Button>
        <Button as={RouterLink} to="./nip19">
          Nip-19 encode/decode
        </Button>
      </Flex>
    </Flex>
  );
}
