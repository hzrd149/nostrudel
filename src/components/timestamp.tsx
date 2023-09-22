import dayjs from "dayjs";
import { Box, BoxProps } from "@chakra-ui/react";

const aDayAgo = dayjs().subtract(1, "day");

export default function Timestamp({ timestamp, ...props }: { timestamp: number } & Omit<BoxProps, "children">) {
  const date = dayjs.unix(timestamp);

  return (
    <Box
      as="time"
      dateTime={date.toISOString()}
      title={date.isBefore(aDayAgo) ? date.fromNow() : date.format("LLL")}
      {...props}
    >
      {date.isBefore(aDayAgo) ? date.format("L LT") : date.fromNow()}
    </Box>
  );
}
