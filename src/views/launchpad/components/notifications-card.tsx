import { Card, CardBody, CardHeader, CardProps, Heading, Link } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import KeyboardShortcut from "../../../components/keyboard-shortcut";

export default function NotificationsCard({ ...props }: Omit<CardProps, "children">) {
  const navigate = useNavigate();

  return (
    <Card variant="outline" {...props}>
      <CardHeader display="flex" justifyContent="space-between" alignItems="center">
        <Heading size="lg">
          <Link as={RouterLink} to="/notifications">
            Notifications
          </Link>
        </Heading>
        <KeyboardShortcut letter="i" requireMeta ml="auto" onPress={() => navigate("/notifications")} />
      </CardHeader>
      <CardBody overflowX="auto" overflowY="hidden" pt="0" display="flex" gap="4"></CardBody>
    </Card>
  );
}
