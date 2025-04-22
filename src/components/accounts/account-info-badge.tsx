import { Badge, BadgeProps } from "@chakra-ui/react";
import { IAccount } from "applesauce-accounts";

export default function AccountTypeBadge({ account, ...props }: BadgeProps & { account: IAccount }) {
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
    <Badge p="1" {...props} variant="solid" colorScheme={color}>
      {account.type}
    </Badge>
  );
}
