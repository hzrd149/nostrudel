import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Text,
  Badge,
  useToast,
} from "@chakra-ui/react";
import { SyntheticEvent, useEffect, useState } from "react";
import { TrashIcon, UndoIcon } from "../../components/icons";
import { RelayFavicon } from "../../components/relay-favicon";
import clientRelaysService from "../../services/client-relays";
import { RelayConfig, RelayMode } from "../../classes/relay";
import { useList } from "react-use";
import { RelayUrlInput } from "../../components/relay-url-input";
import useSubject from "../../hooks/use-subject";
import { RelayStatus } from "../../components/relay-status";
import { normalizeRelayUrl } from "../../helpers/url";
import { RelayScoreBreakdown } from "../../components/relay-score-breakdown";
import RequireCurrentAccount from "../../providers/require-current-account";

function RelaysPage() {
  const relays = useSubject(clientRelaysService.relays);
  const toast = useToast();

  const [pendingAdd, addActions] = useList<RelayConfig>([]);
  const [pendingRemove, removeActions] = useList<RelayConfig>([]);

  useEffect(() => {
    addActions.clear();
    removeActions.clear();
  }, [relays, addActions, removeActions]);

  const [saving, setSaving] = useState(false);
  const [relayInputValue, setRelayInputValue] = useState("");

  const handleRemoveRelay = (relay: RelayConfig) => {
    if (pendingAdd.includes(relay)) {
      addActions.filter((r) => r !== relay);
    } else if (pendingRemove.includes(relay)) {
      removeActions.filter((r) => r !== relay);
    } else {
      removeActions.push(relay);
    }
  };
  const handleAddRelay = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const url = normalizeRelayUrl(relayInputValue);
      if (!relays.some((r) => r.url === url) && !pendingAdd.some((r) => r.url === url)) {
        addActions.push({ url, mode: RelayMode.ALL });
      }
      setRelayInputValue("");
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  };
  const savePending = async () => {
    setSaving(true);
    const newRelays = relays.concat(pendingAdd).filter((r) => !pendingRemove.includes(r));
    await clientRelaysService.postUpdatedRelays(newRelays);
    setSaving(false);
  };

  const hasPending = pendingAdd.length > 0 || pendingRemove.length > 0;

  return (
    <Flex direction="column" pt="2" pb="2" overflow="auto">
      <TableContainer mb="4" overflowY="initial">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Url</Th>
              <Th>Score</Th>
              <Th>Status</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {[...relays, ...pendingAdd].map((relay, i) => (
              <Tr key={relay.url + i}>
                <Td>
                  <Flex alignItems="center">
                    <RelayFavicon size="xs" relay={relay.url} mr="2" />
                    <Text>{relay.url}</Text>
                  </Flex>
                </Td>
                <Td>
                  <RelayScoreBreakdown relay={relay.url} />
                </Td>
                <Td>
                  <RelayStatus url={relay.url} />
                </Td>
                <Td isNumeric>
                  {pendingAdd.includes(relay) && (
                    <Badge colorScheme="green" mr="2">
                      Add
                    </Badge>
                  )}
                  {pendingRemove.includes(relay) && (
                    <Badge colorScheme="red" mr="2">
                      Remove
                    </Badge>
                  )}
                  <IconButton
                    icon={pendingRemove.includes(relay) ? <UndoIcon /> : <TrashIcon />}
                    title="Toggle Remove"
                    aria-label="Toggle Remove"
                    size="sm"
                    onClick={() => handleRemoveRelay(relay)}
                    isDisabled={saving}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      <form onSubmit={handleAddRelay}>
        <FormControl>
          <FormLabel htmlFor="relay-url-input">Add Relay</FormLabel>
          <Flex gap="2">
            <RelayUrlInput
              id="relay-url-input"
              value={relayInputValue}
              onChange={(url) => setRelayInputValue(url)}
              isRequired
            />
            <Button type="submit" isDisabled={saving}>
              Add
            </Button>
          </Flex>
        </FormControl>
      </form>

      <Flex justifyContent="flex-end" gap="2">
        <Button type="submit" isLoading={saving} onClick={savePending} isDisabled={!hasPending}>
          Save Changes
        </Button>
      </Flex>
    </Flex>
  );
}

export default function RelaysView() {
  return (
    <RequireCurrentAccount>
      <RelaysPage />
    </RequireCurrentAccount>
  );
}
