import { Select, SelectProps } from "@chakra-ui/react";
import dayjs from "dayjs";

export type TimeRange = "all" | "yesterday" | "2days" | "lastWeek";

export function getTimeRangeSince(range: TimeRange): number | undefined {
  if (range === "all") return undefined;

  const now = dayjs();

  switch (range) {
    case "yesterday":
      return now.subtract(1, "day").startOf("day").unix();
    case "2days":
      return now.subtract(2, "days").startOf("day").unix();
    case "lastWeek":
      return now.subtract(7, "days").startOf("day").unix();
    default:
      return undefined;
  }
}

export function getTimeRangeLabel(range: TimeRange): string {
  switch (range) {
    case "all":
      return "All Known";
    case "yesterday":
      return "Yesterday";
    case "2days":
      return "Last 2 Days";
    case "lastWeek":
      return "Last Week";
    default:
      return "Custom Range";
  }
}

export interface TimeRangeSelectProps extends Omit<SelectProps, "value" | "onChange" | "children"> {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export default function TimeRangeSelect({ value, onChange, ...props }: TimeRangeSelectProps) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as TimeRange)}
      size="sm"
      w="auto"
      rounded="md"
      {...props}
    >
      <option value="custom">Custom Range</option>
      <option value="yesterday">Yesterday</option>
      <option value="2days">Last 2 Days</option>
      <option value="lastWeek">Last Week</option>
    </Select>
  );
}
