type EmojiShape = {
  keywords: string[];
  char: string;
  fitzpatrick_scale: boolean;
  category: string;
};

declare module "emojilib" {
  const lib: { [key: string]: EmojiShape };
  export { lib };
}
