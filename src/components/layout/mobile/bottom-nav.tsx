import { Flex, IconButton } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { DirectMessagesIcon, RelayIcon, SearchIcon } from "../../icons";
import Home05 from "../../icons/home-05";

export default function MobileBottomNav() {
  return (
    <Flex
      gap="2"
      p="2"
      borderTopWidth={1}
      hideFrom="md"
      bg="var(--chakra-colors-chakra-body-bg)"
      mb="var(--safe-bottom)"
    >
      <IconButton as={RouterLink} to="/" icon={<Home05 boxSize={5} />} aria-label="Search" flex={1} />
      <IconButton as={RouterLink} to="/search" icon={<SearchIcon boxSize={5} />} aria-label="Search" flex={1} />
      <IconButton
        as={RouterLink}
        to="/messages"
        icon={<DirectMessagesIcon boxSize={5} />}
        aria-label="Messages"
        flex={1}
      />
      <IconButton as={RouterLink} to="/network" icon={<RelayIcon boxSize={6} />} aria-label="Network" flex={1} />
    </Flex>
  );
}
