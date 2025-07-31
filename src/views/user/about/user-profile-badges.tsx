import {
  Button,
  Flex,
  FlexProps,
  Heading,
  Image,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { getCoordinateFromAddressPointer } from "applesauce-core/helpers";
import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { getBadgeDescription, getBadgeImage, getBadgeName } from "../../../helpers/nostr/badges";
import useUserProfileBadges from "../../../hooks/use-user-profile-badges";
import { getSharableEventAddress } from "../../../services/relay-hints";

function Badge({ badge, award }: { badge: NostrEvent; award: NostrEvent }) {
  const naddr = getSharableEventAddress(badge);
  const modal = useDisclosure();
  const description = getBadgeDescription(badge);

  return (
    <>
      <Link
        as={RouterLink}
        to={`/badges/${naddr}`}
        onClick={(e) => {
          e.preventDefault();
          modal.onOpen();
        }}
      >
        <Tooltip label={getBadgeName(badge)}>
          <Image w="14" h="14" src={getBadgeImage(badge)?.src ?? ""} />
        </Tooltip>
      </Link>

      <Modal isOpen={modal.isOpen} onClose={modal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <Image src={getBadgeImage(badge)?.src ?? ""} />
          <ModalCloseButton />
          <ModalHeader px="4" pt="2" pb="0">
            {getBadgeName(badge)}
          </ModalHeader>
          <ModalBody px="4" py="2">
            <Text>
              Created by <UserAvatarLink pubkey={badge.pubkey} size="xs" />{" "}
              <UserLink fontWeight="bold" pubkey={badge.pubkey} /> on <Timestamp timestamp={badge.created_at} />
            </Text>
            <Text>
              Date Awarded: <Timestamp timestamp={award.created_at} />
            </Text>
            <Heading size="sm" mt="4">
              Description:
            </Heading>
            {description && <Text>{description}</Text>}
          </ModalBody>
          <ModalFooter p="4">
            <Button as={RouterLink} to={`/badges/${naddr}`}>
              Details
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default function UserProfileBadges({ pubkey, ...props }: Omit<FlexProps, "children"> & { pubkey: string }) {
  const badges = useUserProfileBadges({ pubkey });
  const [limit, setLimit] = useState<number | null>(10);

  if (!badges || badges.length === 0) return null;

  return (
    <Flex direction="column" gap="2" {...props}>
      <Heading size="md">Badges</Heading>
      <Flex gap="2" wrap="wrap" alignItems="center">
        {(limit !== null ? badges.slice(0, limit) : badges)
          .filter((b) => !!b.badge && !!b.award)
          .map(({ badge, award, badgePointer }) => (
            <Badge key={getCoordinateFromAddressPointer(badgePointer)} badge={badge!} award={award!} />
          ))}
        {limit !== null && badges.length > limit && (
          <Button variant="outline" onClick={() => setLimit(null)}>
            Show More
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
