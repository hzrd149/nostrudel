import { useMemo } from "react";
import { Box, Button, ButtonGroup, Flex, Heading, LinkBox, Text } from "@chakra-ui/react";
import { NostrEvent, nip19 } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import HoverLinkOverlay from "../../../components/hover-link-overlay";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { getPageForks, getPageSummary, getPageTitle, getPageTopic } from "../../../helpers/nostr/wiki";
import UserLink from "../../../components/user/user-link";
import Timestamp from "../../../components/timestamp";
import FileSearch01 from "../../../components/icons/file-search-01";
import GitBranch01 from "../../../components/icons/git-branch-01";
import UserName from "../../../components/user/user-name";

export default function WikiPageResult({ page, compare }: { page: NostrEvent; compare?: NostrEvent }) {
  const topic = getPageTopic(page);

  const { address } = useMemo(() => getPageForks(page), [page]);

  return (
    <Flex as={LinkBox} py="2" px="4" direction="column">
      <Flex gap="2" alignItems="center">
        <Box overflow="hidden">
          <Heading size="md">
            <HoverLinkOverlay as={RouterLink} to={`/wiki/page/${getSharableEventAddress(page)}`}>
              {getPageTitle(page)}
            </HoverLinkOverlay>
          </Heading>
          <Text>
            by <UserLink pubkey={page.pubkey} fontWeight="bold " /> - <Timestamp timestamp={page.created_at} />
          </Text>
          <Text color="GrayText" noOfLines={2}>
            {getPageSummary(page)}
          </Text>
        </Box>
      </Flex>
      <ButtonGroup variant="link" mt="auto">
        {address && (
          <Button
            as={RouterLink}
            to={`/wiki/page/${nip19.naddrEncode(address)}`}
            p="2"
            colorScheme="blue"
            leftIcon={<GitBranch01 />}
          >
            <UserName pubkey={address.pubkey} />
          </Button>
        )}
        {compare && (
          <Button
            as={RouterLink}
            to={`/wiki/compare/${topic}/${compare.pubkey}/${page.pubkey}`}
            leftIcon={<FileSearch01 />}
            ml="auto"
          >
            Compare
          </Button>
        )}
      </ButtonGroup>
    </Flex>
  );
}
