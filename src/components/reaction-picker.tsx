import { Divider, Flex, IconButton, Image, Text } from "@chakra-ui/react";

import { DislikeIcon, LikeIcon } from "./icons";
import useCurrentAccount from "../hooks/use-current-account";
import useReplaceableEvent from "../hooks/use-replaceable-event";
import { getEmojis, getPackCordsFromFavorites, getPackName } from "../helpers/nostr/emoji-packs";
import useFavoriteEmojiPacks from "../hooks/use-favorite-emoji-packs";
import useAppSettings from "../hooks/use-app-settings";

export type ReactionPickerProps = {
  onSelect: (emoji: string, url?: string) => void;
};

function EmojiPack({ cord, onSelect }: { cord: string; onSelect: ReactionPickerProps["onSelect"] }) {
  const pack = useReplaceableEvent(cord);
  if (!pack) return null;

  return (
    <>
      <Flex gap="2" alignItems="center">
        <Text whiteSpace="pre">{getPackName(pack)}</Text>
        <Divider />
      </Flex>
      <Flex wrap="wrap" gap="2">
        {getEmojis(pack).map((emoji) => (
          <IconButton
            key={emoji.name}
            icon={<Image src={emoji.url} height="1.2rem" />}
            aria-label={emoji.name}
            title={emoji.name}
            variant="ghost"
            size="sm"
            onClick={() => onSelect(emoji.name, emoji.url)}
          />
        ))}
      </Flex>
    </>
  );
}

export default function ReactionPicker({ onSelect }: ReactionPickerProps) {
  const account = useCurrentAccount();
  const favoritePacks = useFavoriteEmojiPacks(account?.pubkey);
  const { quickReactions } = useAppSettings();

  return (
    <Flex direction="column" gap="2">
      <Flex wrap="wrap" gap="2">
        <IconButton icon={<LikeIcon />} aria-label="Like" variant="ghost" size="sm" onClick={() => onSelect("+")} />
        <IconButton
          icon={<DislikeIcon />}
          aria-label="Dislike"
          variant="ghost"
          size="sm"
          onClick={() => onSelect("-")}
        />
        {quickReactions.map((emoji) => (
          <IconButton
            key={emoji}
            icon={<span>{emoji}</span>}
            aria-label="Shaka"
            variant="ghost"
            size="sm"
            onClick={() => onSelect(emoji)}
          />
        ))}
      </Flex>
      {favoritePacks &&
        getPackCordsFromFavorites(favoritePacks).map((cord) => (
          <EmojiPack key={cord} cord={cord} onSelect={onSelect} />
        ))}
    </Flex>
  );
}
