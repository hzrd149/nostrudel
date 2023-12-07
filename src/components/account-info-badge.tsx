import { Badge, BadgeProps } from "@chakra-ui/react";
import { Account } from "../services/account";

export default function AccountInfoBadge({ account, ...props }: BadgeProps & { account: Account }) {
  if (account.type === "extension") {
    return (
      <Badge {...props} variant="solid" colorScheme="green">
        extension
      </Badge>
    );
  }
  if (account.type === "serial") {
    return (
      <Badge {...props} variant="solid" colorScheme="teal">
        serial
      </Badge>
    );
  }
  if (account.type === "local") {
    return (
      <Badge {...props} variant="solid" colorScheme="red">
        nsec
      </Badge>
    );
  }
  if (account.readonly) {
    return (
      <Badge {...props} variant="solid" colorScheme="blue">
        read-only
      </Badge>
    );
  }
  return null;
}
