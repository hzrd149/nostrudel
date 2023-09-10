import dayjs from "dayjs";
import { Box, BoxProps } from "@chakra-ui/react";

export default function Timestamp({ timestamp, ...props }: { timestamp: number } & Omit<BoxProps, "children">) {
  const date = dayjs.unix(timestamp);
  return (
    <Box as="time" dateTime={date.toISOString()} title={date.format("LLL")} {...props}>
      {date.fromNow()}
    </Box>
  );
}
