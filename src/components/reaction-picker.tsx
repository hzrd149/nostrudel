import { Button, Divider, Flex, IconButton, Image, Input, Text } from "@chakra-ui/react";
import { DislikeIcon, LikeIcon } from "./icons";
import { useCurrentAccount } from "../hooks/use-current-account";
import useUserEmojiPacks from "../hooks/use-users-emoji-packs";
import useEmojiPack from "../hooks/use-emoji-pack";

export type ReactionPickerProps = {
  onSelect: (emoji: string, url?: string) => void;
};

function EmojiPack({ addr, onSelect }: { addr: string; onSelect: ReactionPickerProps["onSelect"] }) {
  const pack = useEmojiPack(addr);

  if (!pack) return null;

  return (
    <>
      <Flex gap="2" alignItems="center">
        <Text whiteSpace="pre">{pack.name}</Text>
        <Divider />
      </Flex>
      <Flex wrap="wrap" gap="2">
        {pack.emojis.map((emoji) => (
          <IconButton
            key={emoji.name}
            icon={<Image src={emoji.url} height="1.2rem" />}
            aria-label={emoji.name}
            variant="outline"
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
  const { packs = [] } = useUserEmojiPacks(account?.pubkey) ?? {};

  return (
    <Flex direction="column" gap="2">
      <Flex wrap="wrap" gap="2">
        <IconButton icon={<LikeIcon />} aria-label="Like" variant="outline" size="sm" onClick={() => onSelect("+")} />
        <IconButton
          icon={<DislikeIcon />}
          aria-label="Dislike"
          variant="outline"
          size="sm"
          onClick={() => onSelect("-")}
        />
        <IconButton
          icon={<span>🤙</span>}
          aria-label="Shaka"
          variant="outline"
          size="sm"
          onClick={() => onSelect("🤙")}
        />
        <IconButton
          icon={<span>🫂</span>}
          aria-label="Hug"
          variant="outline"
          size="sm"
          onClick={() => onSelect("🫂")}
        />
        <Flex>
          <Input placeholder="🔥" display="inline" size="sm" minW="2rem" w="5rem" />
          <Button variant="solid" colorScheme="brand" size="sm">
            Add
          </Button>
        </Flex>
      </Flex>
      {packs.map((addr) => (
        <EmojiPack key={addr} addr={addr} onSelect={onSelect} />
      ))}
    </Flex>
  );
}
