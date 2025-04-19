import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Heading,
  LinkBox,
  Text,
} from "@chakra-ui/react";
import { nip19, NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";

import { getPageForks, getPageSummary, getPageTitle } from "../../../helpers/nostr/wiki";
import { getSharableEventAddress } from "../../../services/relay-hints";
import HoverLinkOverlay from "../../hover-link-overlay";
import GitBranch01 from "../../icons/git-branch-01";
import Timestamp from "../../timestamp";
import UserLink from "../../user/user-link";
import UserName from "../../user/user-name";

export default function EmbeddedWikiPage({ page: page, ...props }: Omit<CardProps, "children"> & { page: NostrEvent }) {
  const { address } = useMemo(() => getPageForks(page), [page]);
  const showFooter = !!address;

  return (
    <Card as={LinkBox} {...props}>
      <CardHeader p="2" pb="0" display="flex" gap="2" alignItems="center">
        <Heading size="md">
          <HoverLinkOverlay as={RouterLink} to={`/wiki/page/${getSharableEventAddress(page)}`}>
            {getPageTitle(page)}
          </HoverLinkOverlay>
        </Heading>
        <Text>
          by <UserLink pubkey={page.pubkey} fontWeight="bold " /> - <Timestamp timestamp={page.created_at} />
        </Text>
      </CardHeader>
      <CardBody p="2" overflow="hidden">
        <Text noOfLines={2}>{getPageSummary(page)}</Text>
      </CardBody>
      {showFooter && (
        <CardFooter>
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
          </ButtonGroup>
        </CardFooter>
      )}
    </Card>
  );
}
