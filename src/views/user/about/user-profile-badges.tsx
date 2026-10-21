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
import { Badge as BadgeCast, BadgeAward } from "applesauce-common/casts";
import { use$ } from "applesauce-react/hooks";
import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import useCastUser from "../../../hooks/use-cast-user";
import { getSharableEventAddress } from "../../../services/relay-hints";

function Badge({ badge, award }: { badge: BadgeCast; award: BadgeAward }) {
  const naddr = getSharableEventAddress(badge.event);
  const modal = useDisclosure();
  const description = badge.description;

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
        <Tooltip label={badge.name}>
          <Image w="14" h="14" src={badge.image?.url ?? ""} />
        </Tooltip>
      </Link>

      <Modal isOpen={modal.isOpen} onClose={modal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <Image src={badge.image?.url ?? ""} />
          <ModalCloseButton />
          <ModalHeader px="4" pt="2" pb="0">
            {badge.name}
          </ModalHeader>
          <ModalBody px="4" py="2">
            <Text>
              Created by <UserAvatarLink pubkey={badge.event.pubkey} size="xs" />{" "}
              <UserLink fontWeight="bold" pubkey={badge.event.pubkey} /> on{" "}
              <Timestamp timestamp={badge.event.created_at} />
            </Text>
            <Text>
              Date Awarded: <Timestamp timestamp={award.event.created_at} />
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
  const slots = use$(useCastUser(pubkey).profileBadges$.badges$);
  const [limit, setLimit] = useState<number | null>(10);

  // skip slots that have not loaded and show each badge once, in profile badges list order
  const badges = useMemo(() => {
    const seen = new Set<string>();
    const loaded: { badge: BadgeCast; award: BadgeAward }[] = [];
    for (const { badge, award } of slots ?? []) {
      if (!badge || !award || seen.has(badge.uid)) continue;
      seen.add(badge.uid);
      loaded.push({ badge, award });
    }
    return loaded;
  }, [slots]);

  if (badges.length === 0) return null;

  return (
    <Flex direction="column" gap="2" {...props}>
      <Heading size="md">Badges</Heading>
      <Flex gap="2" wrap="wrap" alignItems="center">
        {(limit !== null ? badges.slice(0, limit) : badges).map(({ badge, award }) => (
          <Badge key={badge.uid} badge={badge} award={award} />
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
