import { Select, SelectProps } from "@chakra-ui/react";
import dayjs from "dayjs";

export type TimePeriod = "today" | "yesterday" | "lastWeek" | "lastMonth";

export function getTimePeriodTimestamp(period: TimePeriod): number {
  const now = dayjs();

  switch (period) {
    case "today":
      return now.startOf("day").unix();
    case "yesterday":
      return now.subtract(1, "day").startOf("day").unix();
    case "lastWeek":
      return now.subtract(7, "day").startOf("day").unix();
    case "lastMonth":
      return now.subtract(30, "day").startOf("day").unix();
    default:
      return now.unix();
  }
}

export function getTimePeriodLabel(period: TimePeriod): string {
  switch (period) {
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "lastWeek":
      return "Last Week";
    case "lastMonth":
      return "Last Month";
    default:
      return "Today";
  }
}

export interface TimePeriodSelectProps extends Omit<SelectProps, "value" | "onChange" | "children"> {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

export default function TimePeriodSelect({ value, onChange, ...props }: TimePeriodSelectProps) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as TimePeriod)}
      size="sm"
      w="auto"
      rounded="md"
      {...props}
    >
      <option value="today">Today</option>
      <option value="yesterday">Yesterday</option>
      <option value="lastWeek">Last Week</option>
      <option value="lastMonth">Last Month</option>
    </Select>
  );
}
