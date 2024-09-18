import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  ButtonGroup,
  CloseButton,
  Code,
  Flex,
  FlexProps,
  Heading,
  IconButton,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { useContext } from "react";
import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import { SelectedContext } from "../selected-context";
import { getTagValue } from "../../../../helpers/nostr/event";
import DebugEventButton from "../../../../components/debug-modal/debug-event-button";
import SupportedNIPs from "../../../relays/components/supported-nips";
import RelayNotes from "../../../relays/relay/relay-notes";
import { safeRelayUrl } from "../../../../helpers/relay";
import { ExternalLinkIcon } from "../../../../components/icons";
import PeopleListProvider from "../../../../providers/local/people-list-provider";
import { getPubkeysFromList } from "../../../../helpers/nostr/lists";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserName from "../../../../components/user/user-name";
import UserDnsIdentity from "../../../../components/user/user-dns-identity";
import { RelayFavicon } from "../../../../components/relay-favicon";

export default function RelayStatusDetails({ event, ...props }: Omit<FlexProps, "children"> & { event: NostrEvent }) {
  const selected = useContext(SelectedContext);
  const identity = getTagValue(event, "d");
  const network = getTagValue(event, "n");
  const software = getTagValue(event, "s");
  const version = event.tags.find((t) => t[0] === "l" && t[2] === "nip11.version")?.[1];

  const url = identity ? safeRelayUrl(identity) : undefined;

  // gather labels
  const misc: Record<string, string[]> = {};
  for (const tag of event.tags) {
    if (tag[0] == "l" && tag.length >= 3) {
      if (misc[tag[2]]) misc[tag[2]].push(tag[1]);
      else misc[tag[2]] = [tag[1]];
    }
  }

  const nips = event.tags
    .filter((t) => t[0] === "N" && t[1])
    .map((t) => parseInt(t[1]))
    .filter((n) => Number.isFinite(n));

  const pubkeys = getPubkeysFromList(event);

  return (
    <Flex direction="column" gap="2" overflow="hidden" {...props}>
      <Flex gap="2" alignItems="center">
        <CloseButton onClick={() => selected.clearValue()} />
        {identity && <RelayFavicon relay={identity} size="sm" />}
        <Heading size="md" isTruncated>
          {identity}
        </Heading>
        <ButtonGroup ml="auto" variant="ghost" size="sm">
          {identity && (
            <IconButton
              icon={<ExternalLinkIcon />}
              as={RouterLink}
              to={`/r/${encodeURIComponent(identity)}`}
              aria-label="Open"
            />
          )}
          <DebugEventButton event={event} />
        </ButtonGroup>
      </Flex>

      <Accordion allowToggle>
        <AccordionItem>
          <AccordionButton px="2">
            <Box as="span" flex="1" textAlign="left">
              Software info
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel px="2" pb="2" pt="0" display="flex" flexDirection="column" gap="2">
            <Box>
              <Text>NIPs:</Text>
              <SupportedNIPs nips={nips} names />
            </Box>
            {software && (
              <Box>
                <Text>Software:</Text>
                <Code isTruncated>{software}</Code>
                <Text>
                  Version: <Code>{version}</Code>
                </Text>
              </Box>
            )}
          </AccordionPanel>
        </AccordionItem>
        {pubkeys.length > 0 && (
          <AccordionItem>
            <AccordionButton px="2">
              <Box as="span" flex="1" textAlign="left">
                Pubkeys
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel px="2" pb="2" pt="0">
              {pubkeys.map(({ pubkey }) => (
                <Flex gap="2" key={pubkey} alignItems="center">
                  <UserAvatarLink pubkey={pubkey} size="sm" />
                  <UserName isTruncated pubkey={pubkey} />
                </Flex>
              ))}
            </AccordionPanel>
          </AccordionItem>
        )}
        <AccordionItem>
          <AccordionButton px="2">
            <Box as="span" flex="1" textAlign="left">
              Miscellaneous info
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel px="2" pb="2" pt="0">
            {Object.entries(misc).map(([label, values]) => (
              <Text key={label}>
                {label}: {values.join(", ")}
              </Text>
            ))}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      <PeopleListProvider initList="global">
        <Flex overflow="auto" h="full" w="full" direction="column" gap="2">
          {url && <RelayNotes relay={url} />}
        </Flex>
      </PeopleListProvider>
    </Flex>
  );
}
