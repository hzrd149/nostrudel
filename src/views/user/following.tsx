import { useMemo } from "react";
import moment from "moment";
import { Box, Flex, Grid, Heading, IconButton, SkeletonText, Text, Link } from "@chakra-ui/react";
import { Link as ReactRouterLink } from "react-router-dom";

import useSubject from "../../hooks/use-subject";
import userContactsService from "../../services/user-contacts";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { getUserDisplayName } from "../../helpers/user-metadata";
import { AddIcon } from "../../components/icons";
import { UserAvatar } from "../../components/user-avatar";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip-19";

const UserCard = ({ pubkey }: { pubkey: string }) => {
  const metadata = useUserMetadata(pubkey);

  return (
    <Box borderWidth="1px" borderRadius="lg" pl="3" pr="3" pt="2" pb="2" overflow="hidden">
      <Flex gap="4" alignItems="center">
        <UserAvatar pubkey={pubkey} />
        <Link as={ReactRouterLink} to={`/u/${normalizeToBech32(pubkey, Bech32Prefix.Pubkey)}`}>
          <Heading size="sm">{getUserDisplayName(metadata, pubkey)}</Heading>
        </Link>
        <IconButton size="sm" icon={<AddIcon />} aria-label="Follow user" title="Follow" ml="auto" />
      </Flex>
    </Box>
  );
};

export const UserFollowingTab = ({ pubkey }: { pubkey: string }) => {
  const observable = useMemo(() => userContactsService.requestContacts(pubkey, [], true), [pubkey]);
  const contacts = useSubject(observable);

  return (
    <Flex gap="2" direction="column">
      {contacts ? (
        <>
          <Grid templateColumns={{ base: "1fr", xl: "repeat(2, 1fr)", "2xl": "repeat(3, 1fr)" }} gap="2">
            {contacts.contacts.map((contact, i) => (
              <UserCard key={contact.pubkey} pubkey={contact.pubkey} />
            ))}
          </Grid>
          <Text>{`Updated ${moment(contacts?.created_at * 1000).fromNow()}`}</Text>
        </>
      ) : (
        <SkeletonText />
      )}
    </Flex>
  );
};
