import { Image } from "@chakra-ui/react";

export function InlineEmoji({ url, code }: { url: string; code: string }) {
  return (
    <Image
      src={url}
      h="1.5em"
      maxW="3em"
      display="inline-block"
      verticalAlign="middle"
      title={code}
      alt={":" + code + ":"}
      overflow="hidden"
    />
  );
}
