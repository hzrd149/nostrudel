import { Alert, AlertDescription, AlertTitle, Button, Flex, Text } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";

import WifiOff from "../icons/wifi-off";
import bakery from "../../services/bakery";
import useReconnectAction from "../../hooks/use-reconnect-action";
import { useObservable } from "applesauce-react/hooks";

function ReconnectPrompt() {
  const location = useLocation();
  const { error, count } = useReconnectAction();

  return (
    <>
      <Alert status="info" flexWrap="wrap" gap="2" overflow="visible">
        <WifiOff color="blue.500" boxSize={6} />
        <AlertTitle>{count > 0 ? <>Reconnecting in {count}s...</> : <>Reconnecting...</>}</AlertTitle>
        <AlertDescription>trying to reconnect to bakery...</AlertDescription>
        <Flex gap="2">
          <Button as={RouterLink} to="/bakery/connect" replace state={{ back: location }} colorScheme="green" size="sm">
            Reconnect
          </Button>
          <Button as={RouterLink} to="/bakery/connect?config" state={{ back: location }} variant="link" size="sm" p="2">
            Change Node
          </Button>
        </Flex>

        {error && <Text color="red.500">{error.message}</Text>}
      </Alert>
    </>
  );
}

export default function ConnectionStatus() {
  const connected = useObservable(bakery?.connectedSub);

  if (!bakery || connected) return null;
  return <ReconnectPrompt />;
}
