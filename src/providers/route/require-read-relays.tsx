import { PropsWithChildren, useCallback } from "react";
import { Button, ButtonGroup, Flex, Heading } from "@chakra-ui/react";

import { useReadRelays } from "../../hooks/use-client-relays";
import clientRelaysService, { recommendedReadRelays, recommendedWriteRelays } from "../../services/client-relays";
import AddRelayForm from "../../components/relay-management-drawer/add-relay-form";
import { RelayMode } from "../../classes/relay";
import useSubject from "../../hooks/use-subject";
import { offlineMode } from "../../services/offline-mode";

export default function RequireReadRelays({ children }: PropsWithChildren) {
  const readRelays = useReadRelays();
  const offline = useSubject(offlineMode);

  const setDefault = useCallback(() => {
    clientRelaysService.readRelays.next(recommendedReadRelays);
    clientRelaysService.writeRelays.next(recommendedWriteRelays);
    clientRelaysService.saveRelays();
  }, []);

  if (readRelays.size === 0 && !offline)
    return (
      <Flex direction="column" maxW="md" mx="auto" h="full" alignItems="center" justifyContent="center" gap="4">
        <Heading size="md">Looks like you don't have any relays setup</Heading>
        <AddRelayForm onSubmit={(url) => clientRelaysService.addRelay(url, RelayMode.ALL)} w="full" />
        <ButtonGroup ml="auto">
          <Button onClick={() => offlineMode.next(true)}>Offline mode</Button>
          <Button colorScheme="primary" onClick={setDefault}>
            Use recommended
          </Button>
        </ButtonGroup>
      </Flex>
    );

  return children;
}
