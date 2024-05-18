import { forwardRef } from "react";
import {
  Code,
  Heading,
  HeadingProps,
  Image,
  Link,
  LinkProps,
  ListItem,
  OrderedList,
  Table,
  TableContainer,
  TableProps,
  Tbody,
  Td,
  Text,
  TextProps,
  Tfoot,
  Th,
  Thead,
  Tr,
  UnorderedList,
} from "@chakra-ui/react";
import Markdown, { Components, ExtraProps } from "react-markdown";
import styled from "@emotion/styled";
import { NostrEvent } from "nostr-tools";
import remarkGfm from "remark-gfm";
import wikiLinkPlugin from "remark-wiki-link";
import WikiLink from "./wiki-link";

const StyledMarkdown = styled(Markdown)`
  pre > code {
    display: block;
    padding-block: var(--chakra-space-2);
    padding-inline: var(--chakra-space-4);
  }
`;

function H1({ children, node, ...props }: HeadingProps & ExtraProps) {
  return (
    <Heading as="h1" size="2xl" mt="6" mb="2" {...props}>
      {children}
    </Heading>
  );
}
function H2({ children, node, ...props }: HeadingProps & ExtraProps) {
  return (
    <Heading as="h2" size="xl" mt="6" mb="2" {...props}>
      {children}
    </Heading>
  );
}
function H3({ children, node, ...props }: HeadingProps & ExtraProps) {
  return (
    <Heading as="h3" size="lg" mt="4" mb="2" {...props}>
      {children}
    </Heading>
  );
}
function H4({ children, node, ...props }: HeadingProps & ExtraProps) {
  return (
    <Heading as="h4" size="md" my="2" {...props}>
      {children}
    </Heading>
  );
}
function H5({ children, node, ...props }: HeadingProps & ExtraProps) {
  return (
    <Heading as="h5" size="sm" my="2" {...props}>
      {children}
    </Heading>
  );
}
function H6({ children, node, ...props }: HeadingProps & ExtraProps) {
  return (
    <Heading as="h6" size="xs" my="2" {...props}>
      {children}
    </Heading>
  );
}

function A({ children, node, href, ...props }: LinkProps & ExtraProps) {
  const properties: { className?: string; href?: string } | undefined = node?.properties;

  if (properties?.className?.includes("internal") && properties.href) {
    return (
      <WikiLink href={href} node={node} {...props}>
        {children}
      </WikiLink>
    );
  }

  return (
    <Link color="blue.500" isExternal href={href} {...props}>
      {children}
    </Link>
  );
}
function P({ children, node, ...props }: TextProps & ExtraProps) {
  return (
    <Text my="2" {...props}>
      {children}
    </Text>
  );
}
function TableWithContainer({ children, node, ...props }: TableProps & ExtraProps) {
  return (
    <TableContainer>
      <Table size="sm" mb="4" {...props}>
        {children}
      </Table>
    </TableContainer>
  );
}

const components: Partial<Components> = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  a: A,
  img: Image,
  p: P,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  table: TableWithContainer,
  thead: Thead,
  tbody: Tbody,
  tfoot: Tfoot,
  tr: Tr,
  td: Td,
  th: Th,
  code: Code,
};

export const CharkaMarkdown = forwardRef<HTMLDivElement, { children: string }>(({ children }, ref) => {
  return (
    <div ref={ref}>
      <StyledMarkdown remarkPlugins={[remarkGfm, wikiLinkPlugin]} components={components}>
        {children}
      </StyledMarkdown>
    </div>
  );
});

export default function MarkdownContent({ event }: { event: NostrEvent }) {
  return <CharkaMarkdown>{event.content}</CharkaMarkdown>;
}
