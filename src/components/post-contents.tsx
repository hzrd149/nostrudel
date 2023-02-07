import { Image, Link, LinkProps } from "@chakra-ui/react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkImages from "remark-images";
import remarkUnwrapImages from "remark-unwrap-images";
import rehypeExternalLinks from "rehype-external-links";

const CustomLink = (props: LinkProps) => <Link color="blue.500" {...props} />;

const components = {
  img: Image,
  a: CustomLink,
};

export type PostContentsProps = {
  content: string;
};

export const PostContents = React.memo(({ content }: PostContentsProps) => {
  const fixedLines = content.replace(/(?<! )\n/g, "  \n");

  return (
    <ReactMarkdown
      remarkPlugins={[remarkImages, remarkUnwrapImages, remarkGfm]}
      rehypePlugins={[[rehypeExternalLinks, { target: "_blank" }]]}
      components={components}
    >
      {fixedLines}
    </ReactMarkdown>
  );
});
