import { Card, ComponentWithAs, IconProps, Flex, Heading, LinkBox, SimpleGrid, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import HoverLinkOverlay from "../../components/hover-link-overlay";
import { RelayIcon } from "../../components/icons";
import Server01 from "../../components/icons/server-01";
import Telescope from "../../components/icons/telescope";
import Upload01 from "../../components/icons/upload-01";
import SimpleView from "../../components/layout/presets/simple-view";
import { useActiveAccount } from "applesauce-react/hooks";

function FeedTypeCard({
  icon: Icon,
  title,
  description,
  link,
}: {
  icon: ComponentWithAs<"svg", IconProps>;
  title: string;
  description: string;
  link: string;
}) {
  return (
    <Card as={LinkBox} display="block" p="4">
      <Icon boxSize={14} float="left" ml="2" my="2" mr="6" />
      <Flex direction="column">
        <Heading size="md">
          <HoverLinkOverlay as={RouterLink} to={link}>
            {title}
          </HoverLinkOverlay>
        </Heading>
        <Text color="GrayText">{description}</Text>
      </Flex>
    </Card>
  );
}

export default function FeedsHomeView() {
  const account = useActiveAccount();

  return (
    <SimpleView title="Feeds">
      <SimpleGrid columns={{ base: 1, md: 1, lg: 2, xl: 3, "2xl": 4 }} spacing="2">
        {account && (
          <FeedTypeCard
            icon={Telescope}
            title="Blind spots"
            description="See what your friends are seeing that you are not"
            link="/feeds/blindspot"
          />
        )}
        <FeedTypeCard
          icon={RelayIcon}
          title="Relays"
          description="Browser your favorite relays and find new ones"
          link="/feeds/relays"
        />
        {account && (
          <>
            <FeedTypeCard
              icon={Upload01}
              title="Outboxes"
              description="Browse the relays that your friends publish to"
              link="/feeds/outboxes"
            />
            <FeedTypeCard
              icon={Server01}
              title="DVM Feeds"
              description="Discover content through Decentralized Virtual Machines"
              link="/feeds/dvm"
            />
          </>
        )}
      </SimpleGrid>
    </SimpleView>
  );
}
