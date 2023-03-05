import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Flex, Heading, Spinner } from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AccountCard from "./components/account-card";
import useSubject from "../../hooks/use-subject";
import accountService from "../../services/account";

export default function LoginStartView() {
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

          accountService.addAccount({ pubkey, relays, useExtension: true });
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
      <Button onClick={() => navigate("./npub")}>Login with pubkey key (npub)</Button>
      <Button onClick={() => navigate("./nsec")}>Login with secret key (nsec)</Button>
      {accounts.length > 0 && (
        <>
          <Heading size="md" mt="4">
            Accounts:
          </Heading>
          <Flex gap="2" direction="column" minW={300}>
            {accounts.map((account) => (
              <AccountCard key={account.pubkey} pubkey={account.pubkey} />
            ))}
          </Flex>
        </>
      )}
    </Flex>
  );
}
