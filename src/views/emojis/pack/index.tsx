import dayjs from "dayjs";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useThrottle } from "react-use";

import {
  Button,
  ButtonGroup,
  CloseButton,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
} from "@chakra-ui/react";
import { getEmojis, getPackName } from "applesauce-core/helpers/emoji";
import { useActiveAccount } from "applesauce-react/hooks";
import { EventTemplate, kinds, NostrEvent } from "nostr-tools";

import SimpleView from "../../../components/layout/presets/simple-view";
import EventQuoteButton from "../../../components/note/event-quote-button";
import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import EventZapButton from "../../../components/zap/event-zap-button";
import useParamsAddressPointer from "../../../hooks/use-params-address-pointer";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { useDeleteEventContext } from "../../../providers/route/delete-event-provider";
import EmojiPackFavoriteButton from "../components/emoji-pack-favorite-button";
import EmojiPackMenu from "../components/emoji-pack-menu";

function AddEmojiForm({ onAdd }: { onAdd: (values: { shortcode: string; url: string }) => void }) {
  const { register, handleSubmit, watch, getValues, reset } = useForm({
    defaultValues: {
      shortcode: "",
      url: "",
    },
  });

  const submit = handleSubmit((values) => {
    onAdd(values);
    reset();
  });

  watch("url");
  const previewURL = useThrottle(getValues().url);

  return (
    <Flex as="form" gap="2" onSubmit={submit}>
      <Input
        placeholder="shortcode"
        {...register("shortcode", { required: true })}
        pattern="^[a-zA-Z0-9_-]+$"
        autoComplete="off"
        title="emoji shortcode, cannot contain spaces"
      />
      <Input placeholder="https://example.com/emoji.png" {...register("url", { required: true })} autoComplete="off" />
      {previewURL && <Image aspectRatio={1} h="10" src={previewURL} />}
      <Button flexShrink={0} type="submit">
        Add
      </Button>
    </Flex>
  );
}

function EmojiTag({
  shortcode,
  url,
  onRemove,
  scale,
}: {
  shortcode: string;
  url: string;
  onRemove?: () => void;
  scale: number;
}) {
  return (
    <Flex alignItems="center" gap={2} p={1}>
      <Image
        key={shortcode + url}
        src={url}
        title={shortcode}
        alt={`:${shortcode}:`}
        w={scale}
        h={scale}
        overflow="hidden"
      />
      <Text flex={1}>{shortcode}</Text>
      {onRemove && <CloseButton size="sm" onClick={onRemove} />}
    </Flex>
  );
}

function EmojiPackPage({ pack }: { pack: NostrEvent }) {
  const navigate = useNavigate();
  const account = useActiveAccount();
  const publish = usePublishEvent();
  const { deleteEvent } = useDeleteEventContext();
  const [scale, setScale] = useState(10);

  const isAuthor = account?.pubkey === pack.pubkey;
  const emojis = getEmojis(pack);

  const [editing, setEditing] = useState(false);
  const [draftEmojis, setDraft] = useState(emojis);

  const startEdit = () => {
    setDraft(emojis);
    setEditing(true);
  };
  const addEmoji = (emoji: { shortcode: string; url: string }) => {
    setDraft((a) => a.concat(emoji));
  };
  const removeEmoji = (shortcode: string) => {
    setDraft((a) => a.filter((e) => e.shortcode !== shortcode));
  };
  const cancelEdit = () => {
    setDraft([]);
    setEditing(false);
  };
  const saveEdit = async () => {
    const draft: EventTemplate = {
      kind: kinds.Emojisets,
      content: pack.content || "",
      created_at: dayjs().unix(),
      tags: [
        ...pack.tags.filter((t) => t[0] !== "emoji"),
        ...draftEmojis.map(({ shortcode, url }) => ["emoji", shortcode, url]),
      ],
    };

    const pub = await publish("Update emoji pack", draft);
    if (pub) setEditing(false);
  };

  return (
    <SimpleView
      title={getPackName(pack)}
      actions={
        <ButtonGroup ms="auto" size="sm">
          {isAuthor && (
            <>
              {!editing && (
                <Button colorScheme="primary" onClick={startEdit}>
                  Edit
                </Button>
              )}
              <Button
                colorScheme="red"
                onClick={() => deleteEvent(pack).then(() => navigate("/lists"))}
                variant="ghost"
              >
                Delete
              </Button>
            </>
          )}
          <EmojiPackMenu aria-label="More options" pack={pack} variant="ghost" />
        </ButtonGroup>
      }
    >
      <Flex gap="2" alignItems="center">
        <Text>Created by:</Text>
        <UserAvatarLink pubkey={pack.pubkey} size="sm" />
        <UserLink pubkey={pack.pubkey} fontWeight="bold" />
      </Flex>
      <Text>
        Updated: <Timestamp timestamp={pack.created_at} />
      </Text>

      <ButtonGroup variant="ghost">
        <EventZapButton event={pack} />
        <EventQuoteButton event={pack} />
        <EmojiPackFavoriteButton pack={pack} />
      </ButtonGroup>

      {emojis.length > 0 && (
        <>
          {!editing && (
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
          )}
          <SimpleGrid columns={{ base: 2, sm: 3, md: 2, lg: 4, xl: 6 }}>
            {(editing ? draftEmojis : emojis).map(({ shortcode, url }) => (
              <EmojiTag
                key={shortcode + url}
                scale={scale}
                shortcode={shortcode}
                url={url}
                onRemove={editing ? () => removeEmoji(shortcode) : undefined}
              />
            ))}
          </SimpleGrid>
        </>
      )}

      {editing && (
        <Flex gap="2">
          <AddEmojiForm onAdd={addEmoji} />
          <Button ml="auto" onClick={cancelEdit}>
            Cancel
          </Button>
          <Button colorScheme="primary" onClick={saveEdit}>
            Save
          </Button>
        </Flex>
      )}
    </SimpleView>
  );
}

export default function EmojiPackView() {
  const coordinate = useParamsAddressPointer("addr");
  const pack = useReplaceableEvent(coordinate);

  if (!pack) {
    return (
      <>
        Looking for pack "{coordinate.identifier}" created by <UserLink pubkey={coordinate.pubkey} />
      </>
    );
  }

  return <EmojiPackPage pack={pack} />;
}
