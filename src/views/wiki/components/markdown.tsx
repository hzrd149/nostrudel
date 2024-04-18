import { Image, Link, LinkProps, Text, TextProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import Markdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

function A({ children, ...props }: LinkProps) {
  return (
    <Link color="blue.500" isExternal {...props}>
      {children}
    </Link>
  );
}
function P({ children, ...props }: TextProps) {
  return (
    <Text py="2" {...props}>
      {children}
    </Text>
  );
}

const components: Partial<Components> = {
  a: A,
  img: Image,
  p: P,
};

export default function MarkdownContent({ event }: { event: NostrEvent }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {event.content}
    </Markdown>
  );
}
