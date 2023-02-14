import { CloseIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAvatar } from "../../components/user-avatar";
import { getUserDisplayName } from "../../helpers/user-metadata";
import useSubject from "../../hooks/use-subject";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import accountService from "../../services/account";

const AvailableAccount = ({ pubkey }: { pubkey: string }) => {
  // this wont load unless the data is cached since there are no relay connections yet
  const metadata = useUserMetadata(pubkey, []);

  return (
    <Box
      display="flex"
      gap="4"
      alignItems="center"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      padding="2"
      cursor="pointer"
      onClick={() => accountService.switchAccount(pubkey)}
    >
      <UserAvatar pubkey={pubkey} size="sm" />
      <Text flex={1} mr="4" overflow="hidden">
        {getUserDisplayName(metadata, pubkey)}
      </Text>
      <IconButton
        icon={<CloseIcon />}
        aria-label="Remove Account"
        onClick={(e) => {
          e.stopPropagation();
          accountService.removeAccount(pubkey);
        }}
        size="sm"
        variant="ghost"
      />
    </Box>
  );
};

export const LoginStartView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const accounts = useSubject(accountService.accounts);

  const loginWithExtension = async () => {
    if (window.nostr) {
      try {
        setLoading(true);

        const pubkey = await window.nostr.getPublicKey();

        if (!accountService.hasAccount(pubkey)) {
          let relays: string[] = [];
          const extRelays = await window.nostr.getRelays();
          if (Array.isArray(extRelays)) {
            relays = extRelays;
          } else {
            relays = Object.keys(extRelays).filter((url) => extRelays[url].read);
          }

          accountService.addAccount(pubkey, relays, false);
        }

        accountService.switchAccount(pubkey);
      } catch (e) {}
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <Flex direction="column" gap="2" flexShrink={0} alignItems="center">
      <Alert status="warning" maxWidth="30rem">
        <AlertIcon />
        <Box>
          <AlertTitle>This app is half-baked.</AlertTitle>
          <AlertDescription>There are bugs and things will break.</AlertDescription>
        </Box>
      </Alert>
      <Button onClick={loginWithExtension} colorScheme="brand">
        Use browser extension
      </Button>
      <Button onClick={() => navigate("./nip05")}>Login with Nip-05 Id</Button>
      <Button onClick={() => navigate("./npub")}>Login with npub</Button>
      {accounts.length > 0 && (
        <>
          <Heading size="md" mt="4">
            Accounts:
          </Heading>
          <Flex gap="2" direction="column">
            {accounts.map((account) => (
              <AvailableAccount key={account.pubkey} pubkey={account.pubkey} />
            ))}
          </Flex>
        </>
      )}
    </Flex>
  );
};
