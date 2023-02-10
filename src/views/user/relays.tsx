import { Text, Grid, Box, IconButton, Flex, Heading } from "@chakra-ui/react";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { useNavigate, useOutletContext } from "react-router-dom";
import { GlobalIcon } from "../../components/icons";
import { useUserRelays } from "../../hooks/use-user-relays";

const UserRelaysTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contacts = useUserContacts(pubkey);
  const userRelays = useUserRelays(pubkey);
  const navigate = useNavigate();

  return (
    <Flex direction="column">
      {userRelays && (
        <Grid templateColumns={{ base: "1fr", xl: "repeat(2, 1fr)" }} gap="2">
          {userRelays.relays.map((relayConfig) => (
            <Box key={relayConfig.url} display="flex" gap="2" alignItems="center" pr="2" pl="2">
              <Text flex={1}>{relayConfig.url}</Text>
              <IconButton
                icon={<GlobalIcon />}
                onClick={() => navigate("/global?relay=" + relayConfig.url)}
                size="sm"
                aria-label="Global Feed"
              />
            </Box>
          ))}
        </Grid>
      )}
      {contacts && (
        <>
          <Heading size="md">Relays from contact list (old)</Heading>
          <Grid templateColumns={{ base: "1fr", xl: "repeat(2, 1fr)" }} gap="2">
            {Object.entries(contacts.relays).map(([url, opts]) => (
              <Box key={url} display="flex" gap="2" alignItems="center" pr="2" pl="2">
                <Text flex={1}>{url}</Text>
                <IconButton
                  icon={<GlobalIcon />}
                  onClick={() => navigate("/global?relay=" + url)}
                  size="sm"
                  aria-label="Global Feed"
                />
              </Box>
            ))}
          </Grid>
        </>
      )}
    </Flex>
  );
};

export default UserRelaysTab;
