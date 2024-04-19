import {
  Code,
  CodeProps,
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
import styled from "@emotion/styled";
import { NostrEvent } from "nostr-tools";
import Markdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const StyledMarkdown = styled(Markdown)`
  pre > code {
    display: block;
    padding-block: var(--chakra-space-2);
    padding-inline: var(--chakra-space-4);
  }
`;

function H1({ children, ...props }: HeadingProps) {
  return (
    <Heading as="h1" size="xl" mt="6" mb="2" {...props}>
      {children}
    </Heading>
  );
}
function H2({ children, ...props }: HeadingProps) {
  return (
    <Heading as="h2" size="lg" mt="6" mb="2" {...props}>
      {children}
    </Heading>
  );
}
function H3({ children, ...props }: HeadingProps) {
  return (
    <Heading as="h3" size="md" mt="4" mb="2" {...props}>
      {children}
    </Heading>
  );
}
function H4({ children, ...props }: HeadingProps) {
  return (
    <Heading as="h4" size="sm" my="2" {...props}>
      {children}
    </Heading>
  );
}
function H5({ children, ...props }: HeadingProps) {
  return (
    <Heading as="h5" size="xs" my="2" {...props}>
      {children}
    </Heading>
  );
}
function H6({ children, ...props }: HeadingProps) {
  return (
    <Heading as="h6" size="xs" my="2" {...props}>
      {children}
    </Heading>
  );
}
function A({ children, ...props }: LinkProps) {
  return (
    <Link color="blue.500" isExternal {...props}>
      {children}
    </Link>
  );
}
function P({ children, ...props }: TextProps) {
  return (
    <Text my="2" {...props}>
      {children}
    </Text>
  );
}
function TableWithContainer({ children, ...props }: TableProps) {
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

export default function MarkdownContent({ event }: { event: NostrEvent }) {
  return (
    <StyledMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {event.content}
    </StyledMarkdown>
  );
}
