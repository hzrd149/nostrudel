import React from "react";
import {
  AspectRatio,
  Image,
  ImageProps,
  Link,
  LinkProps,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkImages from "remark-images";
import remarkUnwrapImages from "remark-unwrap-images";
import rehypeExternalLinks from "rehype-external-links";
// @ts-ignore
import linkifyRegex from "remark-linkify-regex";
import { InlineInvoiceCard } from "../inline-invoice-card";
import { TweetEmbed } from "../tweet-embed";

const lightningInvoiceRegExp = /(lightning:)?LNBC[A-Za-z0-9]+/i;

// copied from https://stackoverflow.com/a/37704433
const youtubeVideoLink =
  /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/i;

const twitterLink =
  /https?:\/\/twitter\.com\/(?:\#!\/)?(\w+)\/status(es)?\/(\d+)/i;

const CustomLink = (props: LinkProps) => <Link color="blue.500" {...props} />;
const CustomImage = (props: ImageProps) => (
  <AspectRatio ratio={16 / 10} maxWidth="30rem">
    <Image {...props} />
  </AspectRatio>
);

const HandleLinkTypes = (props: LinkProps) => {
  let href = props.href;
  // @ts-ignore
  if (href === "javascript:void(0)") href = String(props.children[0]);

  if (href) {
    if (lightningInvoiceRegExp.test(href)) {
      return (
        <InlineInvoiceCard paymentRequest={href.replace(/lightning:/i, "")} />
      );
    }
    if (youtubeVideoLink.test(href)) {
      const parts = youtubeVideoLink.exec(href);

      return parts ? (
        <AspectRatio ratio={16 / 10} maxWidth="30rem">
          <iframe
            src={`https://www.youtube.com/embed/${parts[6]}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </AspectRatio>
      ) : (
        <CustomLink {...props} />
      );
    }
    if (twitterLink.test(href)) {
      return <TweetEmbed href={href} conversation={false} />;
    }
  }
  return <CustomLink {...props} />;
};

const components = {
  img: CustomImage,
  a: HandleLinkTypes,
};

export type PostContentsProps = {
  content: string;
};

export const PostContents = React.memo(({ content }: PostContentsProps) => {
  const fixedLines = content.replace(/(?<! )\n/g, "  \n");

  return (
    <ReactMarkdown
      remarkPlugins={[
        remarkImages,
        remarkUnwrapImages,
        remarkGfm,
        linkifyRegex(lightningInvoiceRegExp),
      ]}
      rehypePlugins={[[rehypeExternalLinks, { target: "_blank" }]]}
      components={components}
    >
      {fixedLines}
    </ReactMarkdown>
  );
});
