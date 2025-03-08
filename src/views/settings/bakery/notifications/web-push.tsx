import { useEffect, useState } from "react";
import { Alert, AlertIcon, Button, Code, Flex, Heading, useToast } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import { serviceWorkerRegistration } from "../../../../services/worker";
import {
  disableNotifications,
  enableNotifications,
  pushSubscription,
} from "../../../../services/web-push-notifications";
import { controlApi$ } from "../../../../services/bakery";

function WebPushNotificationStatus() {
  const toast = useToast();
  const registration = useObservable(serviceWorkerRegistration);
  const subscription = useObservable(pushSubscription);

  const [loading, setLoading] = useState(false);

  const enable = async () => {
    setLoading(true);
    try {
      await enableNotifications();
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
    setLoading(false);
  };
  const disable = async () => {
    setLoading(true);
    try {
      await disableNotifications();
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
    setLoading(false);
  };

  if (!registration)
    return (
      <Alert status="warning">
        <AlertIcon />
        Web Push notifications are not supported in this browser
      </Alert>
    );

  if (subscription) {
    return (
      <>
        <Code whiteSpace="pre" overflow="auto" p="2" mb="2">
          {JSON.stringify(subscription?.toJSON(), null, 2)}
        </Code>
        <Button colorScheme="red" isLoading={loading} onClick={disable}>
          Disable Notifications
        </Button>
      </>
    );
  }

  return (
    <Alert status="info" whiteSpace="pre-wrap">
      Enable Web Push notifications
      <Button
        variant="ghost"
        isLoading={loading}
        ml="auto"
        onClick={enable}
        isDisabled={!registration || subscription === undefined}
      >
        Enable
      </Button>
    </Alert>
  );
}

export default function WebPushNotificationSettings() {
  const controlApi = useObservable(controlApi$);
  useEffect(() => {
    // controlApi?.send(["CONTROL", "NOTIFICATIONS", "GET-VAPID-KEY"]);
  }, [controlApi]);

  return (
    <>
      <Flex alignItems="center" gap="2">
        <Heading size="md">Web Push</Heading>
      </Flex>
      <WebPushNotificationStatus />
    </>
  );
}
