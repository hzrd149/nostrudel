import { useColorMode } from "@chakra-ui/react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

export type NativeEmoji = {
  id: string;
  keywords: string[];
  name: string;
  native?: string;
  src?: string;
};

export const defaultCategories = ["people", "nature", "foods", "activity", "places", "objects", "symbols", "flags"];

export default function EmojiPicker({
  custom,
  categories = defaultCategories,
  ...props
}: {
  autoFocus?: boolean;
  onEmojiSelect?: (emoji: NativeEmoji) => void;
  custom?: { id: string; name: string; emojis: any[] }[];
  categories?: string[];
}) {
  const { colorMode } = useColorMode();
  return <Picker data={data} custom={custom} categories={["frequent", ...categories]} theme={colorMode} {...props} />;
}
