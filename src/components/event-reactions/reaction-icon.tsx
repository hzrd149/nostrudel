import { Image } from "@chakra-ui/react";
import { DislikeIcon, LikeIcon } from "../icons";

export default function ReactionIcon({ emoji, url }: { emoji: string; url?: string }) {
  if (emoji === "+") return <LikeIcon />;
  if (emoji === "-") return <DislikeIcon />;
  if (url) return <Image src={url} title={emoji} alt={emoji} w="1em" h="1em" display="inline" overflow="hidden" />;
  return <span>{emoji}</span>;
}
