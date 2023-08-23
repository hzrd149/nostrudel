import { Button, Flex, Heading, Image, Link } from "@chakra-ui/react";
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
          href="https://w3.do/"
          isExternal
          target="_blank"
          leftIcon={<Image src="https://w3.do/favicon.ico" h="1.5em" />}
        >
          URL Shortener
        </Button>
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
        <Button
          as={Link}
          href="https://nostrdebug.com/"
          isExternal
          target="_blank"
          leftIcon={<Image src="https://nostrdebug.com/favicon.ico" h="1.5em" />}
        >
          Nostr Debug
        </Button>
        <Button
          as={Link}
          href="https://www.nostrapps.com/"
          isExternal
          target="_blank"
          leftIcon={
            <Image
              src="https://uploads-ssl.webflow.com/641d0d46d5c124ac928a6027/64b1dd06d59d8f1e530d2926_32x32.png"
              h="1.5em"
            />
          }
        >
          Nostr Apps
        </Button>
      </Flex>
    </Flex>
  );
}
