import { PropsWithChildren } from "react";
import { Button, Code, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { Navigate, To, useLocation } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { useObservable } from "applesauce-react/hooks";

import useReconnectAction from "../../hooks/use-reconnect-action";
import { bakery$ } from "../../services/bakery";

function InitialConnectionOverlay() {
  const location = useLocation();
  const bakery = useObservable(bakery$);

  const { error } = useReconnectAction();

  return (
    <Flex w="full" h="full" alignItems="center" justifyContent="center" direction="column">
      <Flex gap="2" alignItems="center">
        <Spinner />
        <Heading size="md">Connecting to...</Heading>
      </Flex>
      <Code>{bakery?.url}</Code>
      {error && <Text color="red">{error.message}</Text>}
      <Button
        variant="link"
        mt="4"
        as={RouterLink}
        to="/settings/bakery/connect"
        replace
        state={{ back: (location.state?.back ?? location) satisfies To }}
      >
        Cancel
      </Button>
    </Flex>
  );
}

export default function RequireBakery({ children }: PropsWithChildren & { requireConnection?: boolean }) {
  const location = useLocation();
  const bakery = useObservable(bakery$);
  const connected = useObservable(bakery?.connected$);

  // if there is no node connection, setup a connection
  if (!bakery)
    return (
      <Navigate
        to="/settings/bakery/connect"
        replace
        state={{ back: (location.state?.back ?? location) satisfies To }}
      />
    );

  if (bakery && connected === false) return <InitialConnectionOverlay />;

  return <>{children}</>;
}
