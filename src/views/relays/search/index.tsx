import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  IconButton,
  Link,
  Text,
  useToast,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { EventTemplate, kinds } from "nostr-tools";
import dayjs from "dayjs";
import { CloseIcon } from "@chakra-ui/icons";

import BackButton from "../../../components/router/back-button";
import useUserSearchRelayList from "../../../hooks/use-user-search-relay-list";
import useCurrentAccount from "../../../hooks/use-current-account";
import { getRelaysFromList, listAddRelay, listRemoveRelay } from "../../../helpers/nostr/lists";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { RelayFavicon } from "../../../components/relay-favicon";
import AddRelayForm from "../app/add-relay-form";
import { useRelayInfo } from "../../../hooks/use-relay-info";

function RelayEntry({
  url,
  onRemove,
  onMakeDefault,
  isDefault,
}: {
  url: string;
  onRemove: () => void;
  onMakeDefault: () => void;
  isDefault: boolean;
}) {
  const { info } = useRelayInfo(url);

  return (
    <Flex key={url} gap="2" alignItems="center" pl="2">
      <RelayFavicon relay={url} size="xs" outline="2px solid" />
      <Box overflow="hidden">
        <Link as={RouterLink} to={`/r/${encodeURIComponent(url)}`} isTruncated>
          {url}
        </Link>
        {info?.supported_nips && !info?.supported_nips.includes(50) && <Text color="red">Search not supported</Text>}
      </Box>
      <ButtonGroup size="sm" ml="auto">
        <Button
          onClick={() => onMakeDefault()}
          variant={isDefault ? "solid" : "ghost"}
          colorScheme={isDefault ? "primary" : undefined}
          isDisabled={isDefault}
        >
          Default
        </Button>
        <IconButton
          aria-label="Remove Relay"
          icon={<CloseIcon />}
          colorScheme="red"
          onClick={() => onRemove()}
          variant="ghost"
        />
      </ButtonGroup>
    </Flex>
  );
}

function emptySearchRelayList(): EventTemplate {
  return {
    kind: kinds.SearchRelaysList,
    tags: [],
    content: "",
    created_at: dayjs().unix(),
  };
}

export default function SearchRelaysView() {
  const toast = useToast();
  const publish = usePublishEvent();
  const account = useCurrentAccount();
  const searchRelayList = useUserSearchRelayList(account?.pubkey);

  const searchRelays = searchRelayList ? getRelaysFromList(searchRelayList) : [];

  const addRelay = async (url: string) => {
    try {
      const draft = listAddRelay(searchRelayList || emptySearchRelayList(), url);
      await publish("Add search relay", draft);
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
  };

  const makeDefault = async (url: string) => {
    try {
      const draft = searchRelayList || emptySearchRelayList();
      draft.tags = Array.from(draft.tags).sort((a, b) => (a[1] === url ? -1 : 1));
      await publish("Set default search relay", draft);
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
  };

  const removeRelay = async (url: string) => {
    try {
      const draft = listRemoveRelay(searchRelayList || emptySearchRelayList(), url);
      await publish("Remove search relay", draft);
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
  };

  return (
    <Flex gap="2" direction="column" overflow="auto hidden" flex={1}>
      <Flex gap="2" alignItems="center">
        <BackButton hideFrom="lg" size="sm" />
        <Heading size="lg" px={{ base: 0, lg: "2" }}>
          Search Relays
        </Heading>
      </Flex>
      <Text fontStyle="italic" px="2" mt="-2">
        These relays are used to search for users and content
      </Text>

      {searchRelays.length === 0 && (
        <Alert
          status="warning"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            No search relays set
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            You need to set at least one search relay to be able to use search
          </AlertDescription>
          <Button mt="2" onClick={() => addRelay("wss://relay.nostr.band/")}>
            Use nostr.band relay
          </Button>
        </Alert>
      )}

      {searchRelays.map((url) => (
        <RelayEntry
          key={url}
          url={url}
          onMakeDefault={() => makeDefault(url)}
          onRemove={() => removeRelay(url)}
          isDefault={searchRelays[0] === url}
        />
      ))}

      <AddRelayForm onSubmit={(relay) => addRelay(relay)} supportedNips={[50]} />
    </Flex>
  );
}
