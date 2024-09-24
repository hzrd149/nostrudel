import { useCallback } from "react";
import { Button, Card, CardBody, CardHeader, CardProps, Heading, Link } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { NostrEvent } from "nostr-tools";
import { getEventUID } from "nostr-idb";

import KeyboardShortcut from "../../../components/keyboard-shortcut";
import { useNotifications } from "../../../providers/global/notifications-provider";
import { NotificationType, typeSymbol } from "../../../classes/notifications";
import NotificationItem from "../../notifications/components/notification-item";
import { ErrorBoundary } from "../../../components/error-boundary";
import { useObservable } from "../../../hooks/use-observable";

export default function NotificationsCard({ ...props }: Omit<CardProps, "children">) {
  const navigate = useNavigate();
  const { notifications } = useNotifications();

  const events =
    useObservable(notifications?.timeline)?.filter(
      (event) =>
        event[typeSymbol] === NotificationType.Mention ||
        event[typeSymbol] === NotificationType.Reply ||
        event[typeSymbol] === NotificationType.Zap,
    ) ?? [];

  const limit = events.length > 20 ? events.slice(0, 20) : events;

  const handleClick = useCallback(
    (event: NostrEvent) => {
      navigate("/notifications", { state: { focused: event.id } });
    },
    [navigate],
  );

  return (
    <Card variant="outline" {...props}>
      <CardHeader display="flex" justifyContent="space-between" alignItems="center" pb="2">
        <Heading size="lg">
          <Link as={RouterLink} to="/notifications">
            Notifications
          </Link>
        </Heading>
        <KeyboardShortcut letter="i" requireMeta ml="auto" onPress={() => navigate("/notifications")} />
      </CardHeader>
      <CardBody overflowX="hidden" overflowY="auto" pt="4" display="flex" flexDirection="column">
        {limit.map((event) => (
          <ErrorBoundary key={getEventUID(event)}>
            <NotificationItem event={event} onClick={handleClick} visible />
          </ErrorBoundary>
        ))}
        <Button as={RouterLink} to="/notifications" flexShrink={0} variant="link" size="lg" py="4">
          View More
        </Button>
      </CardBody>
    </Card>
  );
}
