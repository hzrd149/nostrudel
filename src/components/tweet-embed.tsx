import { useEffect, useRef } from "react";

export type TweetEmbedProps = {
  href: string;
  conversation?: boolean;
};

export const TweetEmbed = ({ href, conversation }: TweetEmbedProps) => {
  const ref = useRef<HTMLQuoteElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      // @ts-ignore
      window.twttr.widgets.load();
    }
  }, []);

  return (
    <blockquote
      className="twitter-tweet"
      ref={ref}
      data-conversation={conversation ? undefined : "none"}
    >
      <a href={href}></a>
    </blockquote>
  );
};
