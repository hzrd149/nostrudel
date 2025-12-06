import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { addRelayTag, removeRelayTag } from "applesauce-factory/operations/tag";
import { useActiveAccount, useEventFactory, useObservableEagerState } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";

import SimpleView from "../../../components/layout/presets/simple-view";
import { getRelaysFromList } from "../../../helpers/nostr/lists";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import useAsyncAction from "../../../hooks/use-async-action";
import useUserSearchRelayList from "../../../hooks/use-user-search-relay-list";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import localSettings from "../../../services/preferences";
import { LookupProvider } from "../../../services/user-lookup";
import AddRelayForm from "../relays/components/add-relay-form";
import RelayControl from "../relays/components/relay-control";
import { PrimalConfig } from "./components/primal-config";
import { RelatrConfig } from "./components/relatr-config";
import { VertexConfig } from "./components/vertex-config";

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
    <Box>
      <RelayControl url={url} onRemove={onRemove}>
        <Button
          onClick={() => onMakeDefault()}
          variant={isDefault ? "solid" : "ghost"}
          colorScheme={isDefault ? "primary" : undefined}
          isDisabled={isDefault}
        >
          Default
        </Button>
      </RelayControl>
      {info?.supported_nips && !info?.supported_nips.includes(50) && (
        <Text color="red" fontSize="sm" mt="1" ml="2">
          Search not supported
        </Text>
      )}
    </Box>
  );
}

export default function SearchSettings() {
  const publish = usePublishEvent();
  const account = useActiveAccount();
  const factory = useEventFactory();
  const searchRelayList = useUserSearchRelayList(account && { pubkey: account.pubkey });

  const searchRelays = searchRelayList ? getRelaysFromList(searchRelayList) : [];

  const addRelay = useAsyncAction(async (url: string) => {
    const draft = await factory.modifyTags(
      searchRelayList || {
        kind: kinds.SearchRelaysList,
        content: "",
        tags: [],
        created_at: Math.floor(Date.now() / 1000),
      },
      addRelayTag(url),
    );
    const signed = await factory.sign(draft);
    await publish("Add search relay", signed);
  });

  const makeDefault = useAsyncAction(async (url: string) => {
    if (!searchRelayList) throw new Error("Missing search relay list");

    const draft = await factory.modifyTags(searchRelayList, (tags) =>
      Array.from(tags).sort((a, b) => (a[1] === url ? -1 : 1)),
    );
    const signed = await factory.sign(draft);
    await publish("Set default search relay", signed);
  });

  const removeRelay = useAsyncAction(async (url: string) => {
    if (!searchRelayList) return;
    const draft = await factory.modifyTags(searchRelayList, removeRelayTag(url));
    const signed = await factory.sign(draft);
    await publish("Remove search relay", signed);
  });

  return (
    <SimpleView title="Search Settings" maxW="4xl">
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
          <Button mt="2" onClick={() => addRelay.run("wss://relay.nostr.band/")}>
            Use nostr.band relay
          </Button>
        </Alert>
      )}

      {searchRelays.map((url) => (
        <RelayEntry
          key={url}
          url={url}
          onMakeDefault={() => makeDefault.run(url)}
          onRemove={() => removeRelay.run(url)}
          isDefault={searchRelays[0] === url}
        />
      ))}

      <AddRelayForm onSubmit={addRelay.run} supportedNips={[50]} />

      <Divider my="6" />

      <UsernameLookupSettings />
    </SimpleView>
  );
}

function UsernameLookupSettings() {
  const selectedProvider = useObservableEagerState(localSettings.usernameLookupProvider) as LookupProvider;

  return (
    <>
      <Box>
        <Heading size="md" mb="2">
          Username Lookup
        </Heading>
        <Text fontSize="sm" color="gray.500" mb="4">
          Select the provider to use for searching users by username.
        </Text>
      </Box>

      <FormControl>
        <FormLabel>Search Provider</FormLabel>
        <Select
          value={selectedProvider}
          onChange={(e) => localSettings.usernameLookupProvider.next(e.target.value)}
          maxW="md"
        >
          <option value="primal">Primal - Uses Primal cache server</option>
          <option value="vertex">Vertex - Uses Vertex relay with ranked results</option>
          <option value="relatr">Relatr - Uses Relatr search server</option>
        </Select>
      </FormControl>

      {selectedProvider === "primal" && <PrimalConfig />}
      {selectedProvider === "vertex" && <VertexConfig />}
      {selectedProvider === "relatr" && <RelatrConfig />}
    </>
  );
}
