import { Text, Box, IconButton, Flex, Badge } from "@chakra-ui/react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { GlobalIcon } from "../../components/icons";
import relayScoreboardService from "../../services/relay-scoreboard";
import { RelayMode } from "../../classes/relay";
import useMergedUserRelays from "../../hooks/use-merged-user-relays";

const UserRelaysTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const userRelays = useMergedUserRelays(pubkey);
  const navigate = useNavigate();

  return (
    <Flex direction="column" gap="2">
      {userRelays.map((relayConfig) => (
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
