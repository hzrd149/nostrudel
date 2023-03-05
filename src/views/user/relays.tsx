import { Text, Grid, Box, IconButton, Flex, Heading, Badge, Alert, AlertIcon } from "@chakra-ui/react";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { useNavigate, useOutletContext } from "react-router-dom";
import { GlobalIcon } from "../../components/icons";
import { useUserRelays } from "../../hooks/use-user-relays";
import { useMemo } from "react";
import relayScoreboardService from "../../services/relay-scoreboard";
import { RelayConfig, RelayMode } from "../../classes/relay";

const UserRelaysTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contacts = useUserContacts(pubkey);
  const userRelays = useUserRelays(pubkey);
  const navigate = useNavigate();

  const relays = useMemo(() => {
    let arr: RelayConfig[] = userRelays?.relays ?? [];
    if (arr.length === 0 && contacts)
      arr = Array.from(Object.entries(contacts.relays)).map(([url, opts]) => ({
        url,
        mode: (opts.write ? RelayMode.WRITE : 0) | (opts.read ? RelayMode.READ : 0),
      }));
    const rankedUrls = relayScoreboardService.getRankedRelays(arr.map((r) => r.url));
    return rankedUrls.map((u) => arr.find((r) => r.url === u) as RelayConfig);
  }, [userRelays, contacts]);

  return (
    <Flex direction="column" gap="2">
      {!userRelays && contacts?.relays && (
        <Alert status="warning">
          <AlertIcon />
          Cant find new relay list
        </Alert>
      )}
      {relays.map((relayConfig) => (
        <Box key={relayConfig.url} display="flex" gap="2" alignItems="center" pr="2" pl="2">
          <Text flex={1}>{relayConfig.url}</Text>
          <Text>{relayScoreboardService.getAverageResponseTime(relayConfig.url).toFixed(2)}ms</Text>
          {relayConfig.mode & RelayMode.WRITE ? <Badge colorScheme="green">Write</Badge> : null}
          {relayConfig.mode & RelayMode.READ ? <Badge>Read</Badge> : null}
          <IconButton
            icon={<GlobalIcon />}
            onClick={() => navigate("/global?relay=" + relayConfig.url)}
            size="sm"
            aria-label="Global Feed"
          />
        </Box>
      ))}
    </Flex>
  );
};

export default UserRelaysTab;
