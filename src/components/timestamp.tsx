import dayjs from "dayjs";
import { Box, BoxProps } from "@chakra-ui/react";

export default function Timestamp({ timestamp, ...props }: { timestamp: number } & Omit<BoxProps, "children">) {
  const date = dayjs.unix(timestamp);
  const now = dayjs();

  let display = date.format("ll");

  if (date.isAfter(now) || date.isSame(now)) {
    display = "now";
  } else if (now.diff(date, "week") <= 6) {
    if (now.diff(date, "d") >= 1) {
      display = Math.round(now.diff(date, "d") * 10) / 10 + `d`;
    } else if (now.diff(date, "h") >= 1) {
      display = Math.round(now.diff(date, "h")) + `h`;
    } else if (now.diff(date, "m") >= 1) {
      display = Math.round(now.diff(date, "m")) + `m`;
    } else if (now.diff(date, "s") >= 1) {
      display = Math.round(now.diff(date, "s")) + `s`;
    }
  }

  return (
    <Box as="time" dateTime={date.toISOString()} title={date.format("LLL")} {...props}>
      {display}
    </Box>
  );
}
