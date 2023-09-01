import { useNavigate, useParams } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { UserLink } from "../../components/user-link";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Divider,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  Spacer,
  Tag,
  Tooltip,
} from "@chakra-ui/react";
import { ArrowLeftSIcon } from "../../components/icons";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useDeleteEventContext } from "../../providers/delete-event-provider";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import EmojiPackMenu from "./components/emoji-pack-menu";
import EmojiPackFavoriteButton from "./components/emoji-pack-favorite-button";
import { getEmojisFromPack, getPackName } from "../../helpers/nostr/emoji-packs";
import { useState } from "react";

function useListCoordinate() {
  const { addr } = useParams() as { addr: string };
  const parsed = nip19.decode(addr);
  if (parsed.type !== "naddr") throw new Error(`Unknown type ${parsed.type}`);
  return parsed.data;
}

export default function EmojiPackView() {
  const navigate = useNavigate();
  const coordinate = useListCoordinate();
  const { deleteEvent } = useDeleteEventContext();
  const account = useCurrentAccount();
  const [scale, setScale] = useState(10);

  const pack = useReplaceableEvent(coordinate);

  if (!pack)
    return (
      <>
        Looking for pack "{coordinate.identifier}" created by <UserLink pubkey={coordinate.pubkey} />
      </>
    );

  const isAuthor = account?.pubkey === pack.pubkey;
  const emojis = getEmojisFromPack(pack);

  return (
    <Flex direction="column" px="2" pt="2" pb="8" overflowY="auto" overflowX="hidden" h="full" gap="2">
      <Flex gap="2" alignItems="center">
        <Button onClick={() => navigate(-1)} leftIcon={<ArrowLeftSIcon />}>
          Back
        </Button>

        <Heading size="md" isTruncated>
          {getPackName(pack)}
        </Heading>
        <EmojiPackFavoriteButton pack={pack} size="sm" />

        <Spacer />

        {isAuthor && (
          <Button colorScheme="red" onClick={() => deleteEvent(pack).then(() => navigate("/lists"))}>
            Delete
          </Button>
        )}
        <EmojiPackMenu aria-label="More options" pack={pack} />
      </Flex>

      {emojis.length > 0 && (
        <>
          <Flex alignItems="flex-end">
            <Heading size="md">Emojis</Heading>
            <ButtonGroup size="sm" isAttached ml="auto">
              <Button variant={scale === 10 ? "solid" : "outline"} onClick={() => setScale(10)}>
                SM
              </Button>
              <Button variant={scale === 16 ? "solid" : "outline"} onClick={() => setScale(16)}>
                MD
              </Button>
              <Button variant={scale === 24 ? "solid" : "outline"} onClick={() => setScale(24)}>
                LG
              </Button>
            </ButtonGroup>
          </Flex>
          <Divider />
          <Card variant="elevated">
            <CardBody p="2">
              <SimpleGrid columns={{ base: 2, sm: 3, md: 2, lg: 4, xl: 6 }} gap="2">
                {emojis.map(({ name, url }) => (
                  <Flex gap="2" alignItems="center">
                    <Image key={name + url} src={url} title={name} w={scale} h={scale} />
                    <Tag>{name}</Tag>
                  </Flex>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>
        </>
      )}
    </Flex>
  );
}
