import { Alert, Button, Text, VStack } from "@chakra-ui/react";

import useMessageAlerts from "../../../../hooks/use-message-alerts";
import useMessaging from "../../../../hooks/use-messaging";

export default function MessageErrors() {
  const session = useMessaging();
  const { errors, startupError } = useMessageAlerts();
  if (!errors.length && !startupError) return null;

  return (
    <Alert status="warning">
      <VStack align="start" spacing="2">
        {startupError && <Text>{startupError}</Text>}
        {errors.map((error) => (
          <Text key={error}>{error}</Text>
        ))}
        {!!errors.length && <Button onClick={() => session?.errors$.next([])}>Dismiss errors</Button>}
      </VStack>
    </Alert>
  );
}
