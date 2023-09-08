import { Button, Flex, Heading, Image, Link, SimpleGrid, Spacer, useDisclosure } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { useCurrentAccount } from "../../hooks/use-current-account";
import { ExternalLinkIcon } from "../../components/icons";
import RequireCurrentAccount from "../../providers/require-current-account";
import BadgeCard from "./components/badge-card";
import { getEventUID } from "../../helpers/nostr/events";

function BadgesPage() {
  const account = useCurrentAccount()!;

  return (
    <Flex direction="column" pt="2" pb="10" gap="2" px={["2", "2", 0]}>
      <Flex gap="2">
        <Button as={RouterLink} to="/badges/browse">
          Browse Badges
        </Button>
        <Spacer />
        <Button
          as={Link}
          href="https://badges.page/"
          isExternal
          rightIcon={<ExternalLinkIcon />}
          leftIcon={<Image src="https://badges.page/favicon.ico" w="1.2em" />}
        >
          Badges
        </Button>
      </Flex>

      {/* {peopleLists.length > 0 && (
        <>
          <Heading size="md">People lists</Heading>
          <Divider />
          <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing="2">
            {peopleLists.map((event) => (
              <BadgeCard key={getEventUID(event)} badge={event} />
            ))}
          </SimpleGrid>
        </>
      )} */}
    </Flex>
  );
}

export default function BadgesView() {
  return (
    <RequireCurrentAccount>
      <BadgesPage />
    </RequireCurrentAccount>
  );
}
