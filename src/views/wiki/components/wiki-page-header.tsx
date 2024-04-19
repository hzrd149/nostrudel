import { Flex, Heading, Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import WikiSearchForm from "./wiki-search-form";

export default function WikiPageHeader() {
  return (
    <Flex gap="2" wrap="wrap">
      <Heading mr="4">
        <Link as={RouterLink} to="/wiki">
          Wikifreedia
        </Link>
      </Heading>
      <WikiSearchForm w="full" />
    </Flex>
  );
}
