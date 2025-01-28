import { Button, Flex, Heading } from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";
import { useActiveAccount } from "applesauce-react/hooks";

export default function RequireActiveAccount({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const account = useActiveAccount();

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
