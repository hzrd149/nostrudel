import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { SettingsIcon } from "../../../components/icons";

export default function MailboxSettingsButton(props: Omit<IconButtonProps, "as" | "to" | "icon" | "aria-label">) {
  return (
    <IconButton
      as={RouterLink}
      to="/settings/mailboxes"
      icon={<SettingsIcon boxSize="1.2em" />}
      aria-label="Mailbox Settings"
      title="Mailbox Settings"
      variant="ghost"
      {...props}
    />
  );
}
