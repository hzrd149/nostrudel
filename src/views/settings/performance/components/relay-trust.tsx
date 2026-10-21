import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  HStack,
  Progress,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import type { OptimisticEventVerifier } from "applesauce-core";
import { use$ } from "applesauce-react/hooks";
import { useEffect } from "react";

import useAsyncAction from "../../../../hooks/use-async-action";
import pool from "../../../../services/pool";
import { loadKnownVerificationRelays, optimisticVerifier$, resetRelayTrust } from "../../../../services/verify-event";

function RelayTrustRow({ relay, verifier }: { relay: string; verifier: OptimisticEventVerifier }) {
  const state = use$(() => verifier.relay$(relay), [verifier, relay]);
  return (
    <Tr>
      <Td>{relay}</Td>
      <Td>
        <HStack spacing="2" minW="32">
          <Progress
            value={(state?.trust ?? 0) * 100}
            isIndeterminate={!state?.ready}
            colorScheme="primary"
            flex="1"
            rounded="full"
            aria-label={`${relay} trust`}
          />
          <Text fontSize="sm" minW="12" textAlign="right">
            {state?.ready ? `${Math.round(state.trust * 100)}%` : "…"}
          </Text>
        </HStack>
      </Td>
    </Tr>
  );
}

function RelayTrustDetails() {
  const verifier = use$(optimisticVerifier$)!;
  const seen = use$(() => verifier.relays$, [verifier]) ?? [];
  const connections = use$(pool.relays$);
  const relays = [...new Set([...seen, ...(connections?.keys() ?? [])])].sort();
  const { run: load, loading: loadingRelays } = useAsyncAction(loadKnownVerificationRelays);
  const { run: reset, loading: resetting } = useAsyncAction(resetRelayTrust);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <Button onClick={() => reset()} isLoading={resetting} isDisabled={loadingRelays} mb="4">
        Reset all trust
      </Button>
      {relays.length === 0 ? (
        <Text>{loadingRelays ? "Loading known relays…" : "No known relays yet."}</Text>
      ) : (
        <TableContainer>
          <Table>
            <Thead>
              <Tr>
                <Th>Relay</Th>
                <Th>Trust</Th>
              </Tr>
            </Thead>
            <Tbody>
              {relays.map((relay) => (
                <RelayTrustRow key={relay} relay={relay} verifier={verifier} />
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}

export default function RelayTrust() {
  return (
    <Accordion allowToggle>
      <AccordionItem>
        {({ isExpanded }) => (
          <>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  Relay trust scores
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel>{isExpanded && <RelayTrustDetails />}</AccordionPanel>
          </>
        )}
      </AccordionItem>
    </Accordion>
  );
}
