import { Button, Divider, Flex, Heading, Image, Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { ExternalLinkIcon, LiveStreamIcon, MapIcon, ToolsIcon } from "../../components/icons";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { ConnectedRelays } from "../../components/connected-relays";

export default function ToolsHomeView() {
  return (
    <VerticalPageLayout>
      <Heading>
        <ToolsIcon /> Tools
      </Heading>
      <Divider />
      <Flex wrap="wrap" gap="4">
        <Button as={RouterLink} to="/tools/content-discovery">
          Content Discovery DVM
        </Button>
        <Button as={RouterLink} to="/tools/network">
          Contact network
        </Button>
        <Button as={RouterLink} to="/tools/network-mute-graph">
          Contacts Mute Graph
        </Button>
        <Button as={RouterLink} to="/tools/network-dm-graph">
          Contacts DM Graph
        </Button>
        <Button as={RouterLink} to="/tools/dm-feed">
          DM Feed
        </Button>
        <Button as={RouterLink} to="/map" leftIcon={<MapIcon />}>
          Map
        </Button>
        <Button as={RouterLink} to="/tools/stream-moderation" leftIcon={<LiveStreamIcon />}>
          Stream Moderation
        </Button>
        <ConnectedRelays />
      </Flex>

      <Heading size="lg" mt="4">
        Third party tools
      </Heading>
      <Divider />
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
          href="https://metadata.nostr.com/"
          isExternal
          target="_blank"
          leftIcon={<Image src="https://metadata.nostr.com/img/git.png" h="1.5em" />}
        >
          Nostr Profile Manager
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
    </VerticalPageLayout>
  );
}
