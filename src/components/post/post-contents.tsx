import React from "react";
import { AspectRatio, Box, Image, ImageProps, Link, useDisclosure } from "@chakra-ui/react";
import { InlineInvoiceCard } from "../inline-invoice-card";
import { TweetEmbed } from "../tweet-embed";

const BlurredImage = (props: ImageProps) => {
  const { isOpen, onToggle } = useDisclosure();
  return <Image onClick={onToggle} cursor="pointer" filter={isOpen ? "" : "blur(1.5rem)"} {...props} />;
};

const embeds: { regexp: RegExp; render: (match: RegExpMatchArray, trusted: boolean) => JSX.Element | string }[] = [
  // Lightning Invoice
  {
    regexp: /(lightning:)?(LNBC[A-Za-z0-9]+)/im,
    render: (match) => <InlineInvoiceCard key={match[0]} paymentRequest={match[2]} />,
  },
  // Twitter tweet
  {
    regexp: /^https?:\/\/twitter\.com\/(?:\#!\/)?(\w+)\/status(es)?\/(\d+)/im,
    render: (match) => <TweetEmbed key={match[0]} href={match[0]} conversation={false} />,
  },
  // Youtube Video
  {
    regexp:
      /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/im,
    render: (match) => (
      <AspectRatio ratio={16 / 10} maxWidth="30rem">
        <iframe
          src={`https://www.youtube.com/embed/${match[6]}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          width="100%"
        ></iframe>
      </AspectRatio>
    ),
  },
  // Image
  {
    regexp: /(https?:\/\/)([\da-z\.-]+\.[a-z\.]{2,6})([\/\w\.-]+\.(svg|gif|png|jpg|jpeg|webp|avif))/im,
    render: (match, trusted) => {
      const ImageComponent = trusted ? Image : BlurredImage;
      return <ImageComponent key={match[0]} src={match[0]} maxWidth="30rem" />;
    },
  },
  // Video
  {
    regexp: /(https?:\/\/)([\da-z\.-]+\.[a-z\.]{2,6})([\/\w\.-]+\.(mp4))/im,
    render: (match) => (
      <AspectRatio ratio={16 / 9} maxWidth="30rem">
        <video key={match[0]} src={match[0]} controls />
      </AspectRatio>
    ),
  },
  // Link
  {
    regexp: /(https?:\/\/[^\s]+)/im,
    render: (match) => (
      <Link key={match[0]} color="blue.500" href={match[0]} target="_blank">
        {match[0]}
      </Link>
    ),
  },
];

export type PostContentsProps = {
  content: string;
  trusted?: boolean;
};

export const PostContents = React.memo(({ content, trusted }: PostContentsProps) => {
  const parts: (string | JSX.Element)[] = [content];

  for (const { regexp, render } of embeds) {
    let i = 0;
    while (i < 1000) {
      i++;
      const str = parts.pop();
      if (typeof str !== "string" || str.length === 0) {
        str && parts.push(str);
        break;
      }

      const match = str.match(regexp);
      if (match && match.index !== undefined) {
        parts.push(str.slice(0, match.index));
        parts.push(render(match, trusted ?? false));
        parts.push(str.slice(match.index + match[0].length, str.length));
      } else {
        parts.push(str);
        break;
      }
    }
  }

  return (
    <Box whiteSpace="pre-wrap">{parts.map((part) => (typeof part === "string" ? <span>{part}</span> : part))}</Box>
  );
});
