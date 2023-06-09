import { useColorMode } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

export type TweetEmbedProps = {
  href: string;
  conversation?: boolean;
};

export const TweetEmbed = ({ href, conversation }: TweetEmbedProps) => {
  const ref = useRef<HTMLQuoteElement | null>(null);
  const { colorMode } = useColorMode();

  useEffect(() => {
    if (ref.current) {
      // @ts-ignore
      window.twttr?.widgets.load();
    }
  }, []);

  return (
    <blockquote
      className="twitter-tweet"
      ref={ref}
      data-conversation={conversation ? undefined : "none"}
      data-theme={colorMode}
    >
      <a href={href}></a>
    </blockquote>
  );
};
