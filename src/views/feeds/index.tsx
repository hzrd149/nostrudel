import { Card, Flex, Heading, LinkBox, SimpleGrid, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import HoverLinkOverlay from "../../components/hover-link-overlay";
import { RelayIcon } from "../../components/icons";
import Server01 from "../../components/icons/server-01";
import Telescope from "../../components/icons/telescope";
import Upload01 from "../../components/icons/upload-01";
import SimpleView from "../../components/layout/presets/simple-view";

export default function FeedsHomeView() {
  return (
    <SimpleView title="Feeds">
      <SimpleGrid columns={{ base: 1, md: 1, lg: 2, xl: 3, "2xl": 4 }} spacing="2">
        <Card as={LinkBox} display="block" p="4">
          <Telescope boxSize={14} float="left" ml="2" my="2" mr="6" />
          <Flex direction="column">
            <Heading size="md">
              <HoverLinkOverlay as={RouterLink} to="/feeds/blindspot">
                Blind spots
              </HoverLinkOverlay>
            </Heading>
            <Text color="GrayText">See what your friends are seeing that you are not</Text>
          </Flex>
        </Card>
        <Card as={LinkBox} display="block" p="4">
          <RelayIcon boxSize={14} float="left" ml="2" my="2" mr="6" />
          <Flex direction="column">
            <Heading size="md">
              <HoverLinkOverlay as={RouterLink} to="/feeds/relays">
                Relays
              </HoverLinkOverlay>
            </Heading>
            <Text color="GrayText">Browser your favorite relays and find new ones</Text>
          </Flex>
        </Card>
        <Card as={LinkBox} display="block" p="4">
          <Upload01 boxSize={14} float="left" ml="2" my="2" mr="6" />
          <Flex direction="column">
            <Heading size="md">
              <HoverLinkOverlay as={RouterLink} to="/feeds/outboxes">
                Outboxes
              </HoverLinkOverlay>
            </Heading>
            <Text color="GrayText">Browse the relays that your friends publish to</Text>
          </Flex>
        </Card>
        <Card as={LinkBox} display="block" p="4">
          <Server01 boxSize={14} float="left" ml="2" my="2" mr="6" />
          <Flex direction="column">
            <Heading size="md">
              <HoverLinkOverlay as={RouterLink} to="/feeds/dvm">
                DVM Feeds
              </HoverLinkOverlay>
            </Heading>
            <Text color="GrayText">Discover content through Decentralized Virtual Machines</Text>
          </Flex>
        </Card>
      </SimpleGrid>
    </SimpleView>
  );
}
