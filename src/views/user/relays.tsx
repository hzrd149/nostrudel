import { Text, Box, IconButton, Flex, Badge } from "@chakra-ui/react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { GlobalIcon } from "../../components/icons";
import { RelayMode } from "../../classes/relay";
import useFallbackUserRelays from "../../hooks/use-fallback-user-relays";
import { RelayScoreBreakdown } from "../../components/relay-score-breakdown";
import useRankedRelayConfigs from "../../hooks/use-ranked-relay-configs";

const UserRelaysTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const userRelays = useFallbackUserRelays(pubkey);
  const navigate = useNavigate();

  const ranked = useRankedRelayConfigs(userRelays);

  return (
    <Flex direction="column" gap="2">
      {ranked.map((relayConfig) => (
        <Box key={relayConfig.url} display="flex" gap="2" alignItems="center" pr="2" pl="2">
          <Text flex={1}>{relayConfig.url}</Text>
          <RelayScoreBreakdown relay={relayConfig.url} />
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
