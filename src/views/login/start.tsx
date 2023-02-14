import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Flex, Spinner } from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useSubject from "../../hooks/use-subject";
import accountService from "../../services/account";

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
    <>
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
      <Button variant="link" onClick={() => navigate("./npub")}>
        Login with npub
      </Button>
      <Flex gap="2" direction="column">
        {accounts.map((account) => (
          <Button key={account.pubkey} onClick={() => accountService.switchAccount(account.pubkey)}>
            {account.pubkey}
          </Button>
        ))}
      </Flex>
    </>
  );
};
