import {
  MouseEventHandler,
  PropsWithChildren,
  ReactNode,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { Box, Flex, Spacer, Text, useColorModeValue } from "@chakra-ui/react";
import dayjs from "dayjs";

import UserAvatar from "../../../components/user/user-avatar";
import Timestamp from "../../../components/timestamp";
import UserName from "../../../components/user/user-name";
import { CheckIcon } from "../../../components/icons";
import FocusedContext from "../focused-context";
import useReadStatus from "../../../hooks/use-read-status";
import { usePrevious } from "react-use";

const ONE_MONTH = dayjs().add(1, "month").unix();

type NotificationIconEntryProps = PropsWithChildren<{
  icon: ReactNode;
  pubkey: string;
  timestamp: number;
  summary: ReactNode;
  id: string;
  onClick?: () => void;
}>;

const NotificationIconEntry = memo(
  forwardRef<HTMLDivElement, NotificationIconEntryProps>(
    ({ children, icon, pubkey, timestamp, summary, id, onClick }, ref) => {
      const { id: focused, focus } = useContext(FocusedContext);
      const [read, setRead] = useReadStatus(id, ONE_MONTH);
      const focusColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");

      const expanded = focused === id;
      const headerRef = useRef<HTMLDivElement | null>(null);

      const handleClick = useCallback<MouseEventHandler<HTMLDivElement>>(
        (e) => {
          focus(expanded ? "" : id);
          if (onClick) onClick();
        },
        [id, focus, expanded],
      );

      // scroll into view when opened
      const prev = usePrevious(focused);
      useEffect(() => {
        if (prev && prev !== focused && focused === id) {
          setTimeout(() => {
            headerRef.current?.scrollIntoView();
          }, 2);
        }
      }, [prev, focused]);

      // set read when expanded
      useEffect(() => {
        if (!read && expanded) setRead(true);
      }, [read, expanded]);

      return (
        <Flex
          direction="column"
          bg={expanded ? "whiteAlpha.100" : undefined}
          rounded="md"
          flexGrow={1}
          overflow="hidden"
          ref={ref}
        >
          <Flex
            gap="2"
            alignItems="center"
            cursor="pointer"
            p="2"
            tabIndex={0}
            onClick={handleClick}
            userSelect="none"
            bg={!read ? focusColor : undefined}
            ref={headerRef}
            overflow="hidden"
          >
            <Box>{icon}</Box>
            <UserAvatar pubkey={pubkey} size="sm" />
            <UserName pubkey={pubkey} hideBelow="md" />
            <Text isTruncated>{summary}</Text>
            <Spacer />
            {read && <CheckIcon boxSize={5} color="green.500" />}
            <Timestamp timestamp={timestamp} whiteSpace="pre" />
          </Flex>

          {expanded && (
            <Flex direction="column" w="full" gap="2" overflow="hidden" p="2">
              {children}
            </Flex>
          )}
        </Flex>
      );
    },
  ),
);

export default NotificationIconEntry;
