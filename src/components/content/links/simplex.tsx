import { Button, Image, Link } from "@chakra-ui/react";
import { ExternalLinkIcon } from "../../icons";

export function renderSimpleXLink(match: URL) {
  if (match.hostname !== "simplex.chat") return null;
  if (!match.pathname.startsWith("/contact")) return null;

  return (
    <Button
      as={Link}
      isExternal
      rightIcon={<ExternalLinkIcon />}
      leftIcon={<Image src="https://simplex.chat/img/favicon.ico" w="6" h="6" />}
      href={match.toString()}
      variant="outline"
      colorScheme="blue"
    >
      SimpleX Invite
    </Button>
  );
}
