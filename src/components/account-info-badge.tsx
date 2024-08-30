import { Badge, BadgeProps } from "@chakra-ui/react";
import { Account } from "../classes/accounts/account";

export default function AccountTypeBadge({ account, ...props }: BadgeProps & { account: Account }) {
  let color = "gray";
  switch (account.type) {
    case "extension":
      color = "green";
      break;
    case "serial":
      color = "teal";
      break;
    case "local":
      color = "orange";
      break;
    case "nsec":
      color = "red";
      break;
    case "pubkey":
      color = "blue";
      break;
  }

  return (
    <Badge {...props} variant="solid" colorScheme={color}>
      {account.type}
    </Badge>
  );
}
