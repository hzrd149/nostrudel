import { MutableRefObject, PropsWithChildren, forwardRef } from "react";
import { Divider, Flex, Heading, useDisclosure } from "@chakra-ui/react";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';

import { ExpandableToggleButton } from "../notification-item";

dayjs.extend(utc);

const specialNames = {
  [dayjs().utc().startOf("day").unix()]: "Today",
  [dayjs().utc().subtract(1, "day").startOf("day").unix()]: "Yesterday",
};

const DayGroup = forwardRef<HTMLDivElement, PropsWithChildren<{ day: number; hideRefOnClose?: boolean }>>(
  ({ day, children, hideRefOnClose = false }, ref) => {
    const expanded = useDisclosure({ defaultIsOpen: true });
    const now = dayjs();
    const date = dayjs.unix(day);
    let title = specialNames[day] || date.fromNow();
    if (now.diff(date, "week") > 2) {
      title = date.format("L");
    }

    return (
      <>
        <Flex gap="4" alignItems="center" mt="4" ref={hideRefOnClose && !expanded ? undefined : ref}>
          <Divider w="10" flexShrink={0} />
          <Heading size="lg" whiteSpace="nowrap">
            {title}
          </Heading>
          <Divider />
          <ExpandableToggleButton toggle={expanded} aria-label="Toggle day" title="Toggle day" />
        </Flex>
        {expanded.isOpen && children}
      </>
    );
  },
);

export default DayGroup;
