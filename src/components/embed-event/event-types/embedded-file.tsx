import { Box, Card, CardBody, CardProps, Flex, Heading, Image, LinkBox, Text } from "@chakra-ui/react";
import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import { getArticlePublishDate } from "../../../helpers/nostr/long-form";
import { formatBytes } from "../../../helpers/number";
import useShareableEventAddress from "../../../hooks/use-shareable-event-address";
import HoverLinkOverlay from "../../hover-link-overlay";
import Timestamp from "../../timestamp";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";

export default function EmbeddedFile({ file, ...props }: Omit<CardProps, "children"> & { file: NostrEvent }) {
  const name = getTagValue(file, "name");
  const image = getTagValue(file, "thumb") || getTagValue(file, "image");
  const summary = getTagValue(file, "summary") || getTagValue(file, "alt");
  const type = getTagValue(file, "m");
  const size = getTagValue(file, "size");

  const naddr = useShareableEventAddress(file);

  return (
    <Card as={LinkBox} size="sm" {...props}>
      {image && (
        <Box
          backgroundImage={image}
          w="full"
          aspectRatio={3 / 1}
          hideFrom="md"
          backgroundRepeat="no-repeat"
          backgroundPosition="center"
          backgroundSize="cover"
        />
      )}
      <CardBody>
        {image && (
          <Image src={image} alt={name} maxW="3in" maxH="2in" float="right" borderRadius="md" ml="2" hideBelow="md" />
        )}
        <Flex gap="2" alignItems="center" mb="2">
          <UserAvatarLink pubkey={file.pubkey} size="sm" />
          <UserLink pubkey={file.pubkey} fontWeight="bold" isTruncated />
          <Timestamp timestamp={getArticlePublishDate(file) ?? file.created_at} />
        </Flex>
        <Heading size="md">
          <HoverLinkOverlay as={RouterLink} to={`/files/${naddr}`}>
            {name}
          </HoverLinkOverlay>
        </Heading>
        <Text>
          {type} {size && formatBytes(parseInt(size))}
        </Text>
        <Text my="2">{summary}</Text>
      </CardBody>
    </Card>
  );
}
