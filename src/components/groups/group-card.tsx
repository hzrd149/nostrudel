import { Avatar, Box, Card, CardBody, CardHeader, CardProps, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { encodeGroupPointer, GroupPointer } from "applesauce-core/helpers/groups";
import { useEventModel } from "applesauce-react/hooks";
import { Link as RouterLink } from "react-router-dom";

import { GroupInfoQuery } from "../../models/group";
import HoverLinkOverlay from "../hover-link-overlay";
import UserAvatarLink from "../user/user-avatar-link";

export interface GroupCardProps extends Omit<CardProps, "children"> {
  group: GroupPointer;
  users?: string[];
}

export default function GroupCard({ group, users = [], ...props }: GroupCardProps) {
  const encodedGroup = encodeGroupPointer(group);
  const info = useEventModel(GroupInfoQuery, [group]);

  return (
    <Card {...props}>
      <CardHeader p="4">
        <HoverLinkOverlay as={RouterLink} to={`/groups/${encodedGroup}`} display="flex" gap="2">
          {info?.picture && <Avatar src={info.picture} size="md" />}
          <Box flex={1} overflow="hidden">
            <Heading size="md" isTruncated>
              {info?.name || group.name || group.id}
            </Heading>
            <Text fontSize="sm" color="GrayText">
              {new URL(group.relay).hostname}
            </Text>
          </Box>
        </HoverLinkOverlay>
      </CardHeader>

      <CardBody px="4" pb="2" pt="0">
        <VStack align="start" spacing="2">
          {info?.about && <Text noOfLines={2}>{info.about}</Text>}

          {users.length > 0 && (
            <HStack spacing="1">
              {users.slice(0, 5).map((pubkey) => (
                <UserAvatarLink key={pubkey} pubkey={pubkey} size="xs" />
              ))}
              {users.length > 5 && (
                <Text fontSize="xs" color="gray.500">
                  +{users.length - 5} more
                </Text>
              )}
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}
