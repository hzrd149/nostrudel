import { Button, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";
import { useObservable } from "applesauce-react/hooks";

import accountService from "../../services/account";
import { deleteDatabase } from "../../services/db";

export default function RequireCurrentAccount({ children }: { children: JSX.Element }) {
  let location = useLocation();
  const loading = useObservable(accountService.loading);
  const account = useObservable(accountService.current);

  if (loading) {
    return (
      <Flex alignItems="center" height="100%" gap="4" direction="column">
        <Flex gap="4" grow="1" alignItems="center">
          <Spinner />
          <Text>Loading Accounts</Text>
        </Flex>
        <Button variant="link" margin="4" onClick={() => deleteDatabase()}>
          Stuck loading? clear cache
        </Button>
      </Flex>
    );
  }

  if (!account)
    return (
      <Flex direction="column" w="full" h="full" alignItems="center" justifyContent="center" gap="4">
        <Heading size="md">You must be signed in to use this view</Heading>
        <Button as={Link} to="/signin" state={{ from: location.pathname }} colorScheme="primary">
          Sign in
        </Button>
      </Flex>
    );

  return children;
}
