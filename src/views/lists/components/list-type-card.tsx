import {
  AvatarGroup,
  Card,
  CardBody,
  CardFooter,
  ComponentWithAs,
  Flex,
  Heading,
  Icon,
  IconProps,
  LinkBox,
  Text,
} from "@chakra-ui/react";
import { ProfilePointer } from "nostr-tools/nip19";

import HoverLinkOverlay from "../../../components/hover-link-overlay";
import RouterLink from "../../../components/router-link";
import UserAvatar from "../../../components/user/user-avatar";
import Timestamp from "../../../components/timestamp";

export default function ListTypeCard({
  title,
  path,
  summary,
  icon,
  people,
  updated,
}: {
  title: string;
  path: string;
  summary?: string;
  icon: ComponentWithAs<"svg", IconProps>;
  people?: ProfilePointer[];
  updated?: number;
}) {
  return (
    <Card key={title} as={LinkBox}>
      <CardBody display="flex" gap="4">
        <Icon as={icon} boxSize={10} />
        <Flex gap="2" flexDirection="column">
          <Heading size="md">
            <HoverLinkOverlay as={RouterLink} to={path}>
              {title}
            </HoverLinkOverlay>
          </Heading>

          {summary && <Text whiteSpace="pre-line">{summary}</Text>}

          {people?.length && (
            <AvatarGroup size="sm">
              {people.slice(0, 10).map((p) => (
                <UserAvatar pubkey={p.pubkey} />
              ))}
            </AvatarGroup>
          )}
        </Flex>
      </CardBody>
      {updated && (
        <CardFooter p="2">
          <Text>
            updated <Timestamp timestamp={updated} />
          </Text>
        </CardFooter>
      )}
    </Card>
  );
}
