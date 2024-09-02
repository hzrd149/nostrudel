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
import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { NostrEvent } from "../../../types/nostr-event";
import UserLink from "../../user/user-link";
import { getPageForks, getPageSummary, getPageTitle } from "../../../helpers/nostr/wiki";
import HoverLinkOverlay from "../../hover-link-overlay";
import Timestamp from "../../timestamp";
import GitBranch01 from "../../icons/git-branch-01";
import UserName from "../../user/user-name";
import relayHintService from "../../../services/event-relay-hint";

export default function EmbeddedWikiPage({ page: page, ...props }: Omit<CardProps, "children"> & { page: NostrEvent }) {
  const { address } = useMemo(() => getPageForks(page), [page]);
  const showFooter = !!address;

  return (
    <Card as={LinkBox} {...props}>
      <CardHeader p="2" pb="0" display="flex" gap="2" alignItems="center">
        <Heading size="md">
          <HoverLinkOverlay as={RouterLink} to={`/wiki/page/${relayHintService.getSharableEventAddress(page)}`}>
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
