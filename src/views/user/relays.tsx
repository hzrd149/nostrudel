import { useCallback } from "react";
import { SkeletonText, Text, Grid, Box, IconButton } from "@chakra-ui/react";
import settings from "../../services/settings";
import useSubject from "../../hooks/use-subject";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { useNavigate, useOutletContext } from "react-router-dom";
import { AddIcon, GlobalIcon } from "../../components/icons";

const UserRelaysTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contacts = useUserContacts(pubkey);
  const navigate = useNavigate();

  const relays = useSubject(settings.relays);
  const addRelay = useCallback(
    (url: string) => {
      settings.relays.next([...relays, url]);
    },
    [relays]
  );

  if (!contacts) {
    return <SkeletonText />;
  }

  return (
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
          <IconButton
            icon={<AddIcon />}
            onClick={() => addRelay(url)}
            isDisabled={relays.includes(url)}
            size="sm"
            aria-label="Add Relay"
          />
        </Box>
      ))}
    </Grid>
  );
};

export default UserRelaysTab;
