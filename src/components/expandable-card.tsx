import { Badge, Card, Collapse, Flex, HStack, IconButton, Spinner, Text, useDisclosure } from "@chakra-ui/react";
import { ReactNode } from "react";

import { ChevronDownIcon, ChevronUpIcon } from "./icons";

interface ExpandableCardProps {
  title: string;
  badge?: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  expandedActions?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  onExpand?: () => void | Promise<void>;
}

export default function ExpandableCard({
  title,
  badge,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No data found",
  expandedActions,
  children,
  defaultOpen = false,
  onExpand,
}: ExpandableCardProps) {
  const { isOpen, onToggle } = useDisclosure({
    defaultIsOpen: defaultOpen,
    onOpen: onExpand,
  });

  return (
    <Card p={4} rounded="md">
      <Flex justify="space-between" align="center" mb={isOpen ? 4 : 0}>
        <HStack>
          <Text fontSize="lg" fontWeight="bold">
            {title}
          </Text>
          {badge}
        </HStack>
        <HStack>
          {isOpen && expandedActions}
          <IconButton
            aria-label={isOpen ? `Collapse ${title.toLowerCase()}` : `Expand ${title.toLowerCase()}`}
            icon={isOpen ? <ChevronUpIcon boxSize={5} /> : <ChevronDownIcon boxSize={5} />}
            size="sm"
            variant="ghost"
            onClick={onToggle}
          />
        </HStack>
      </Flex>

      <Collapse in={isOpen}>
        {isLoading ? (
          <Flex justify="center" p={4}>
            <Spinner />
          </Flex>
        ) : isEmpty ? (
          <Text color="gray.500" textAlign="center" py={4}>
            {emptyMessage}
          </Text>
        ) : (
          children
        )}
      </Collapse>
    </Card>
  );
}
