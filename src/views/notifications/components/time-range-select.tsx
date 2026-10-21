import { Select, SelectProps } from "@chakra-ui/react";

const DAY = 86400;

export const TIME_RANGES = {
  day: { label: "Last 24 hours", seconds: DAY },
  "3days": { label: "Last 3 days", seconds: 3 * DAY },
  week: { label: "Last week", seconds: 7 * DAY },
  month: { label: "Last month", seconds: 30 * DAY },
  "3months": { label: "Last 3 months", seconds: 90 * DAY },
} as const;

export type TimeRange = keyof typeof TIME_RANGES;
export const DEFAULT_TIME_RANGE: TimeRange = "week";

/** Returns the range if it is a known one, otherwise the default (covers stale persisted values) */
export function parseTimeRange(value: unknown): TimeRange {
  return typeof value === "string" && Object.hasOwn(TIME_RANGES, value) ? (value as TimeRange) : DEFAULT_TIME_RANGE;
}

export function getTimeRangeSince(range: TimeRange): number {
  return Math.floor(Date.now() / 1000) - TIME_RANGES[range].seconds;
}

export function getTimeRangeLabel(range: TimeRange): string {
  return TIME_RANGES[range].label;
}

export interface TimeRangeSelectProps extends Omit<SelectProps, "value" | "onChange" | "children"> {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export default function TimeRangeSelect({ value, onChange, ...props }: TimeRangeSelectProps) {
  return (
    <Select value={value} onChange={(e) => onChange(parseTimeRange(e.target.value))} w="auto" rounded="md" {...props}>
      {Object.entries(TIME_RANGES).map(([range, { label }]) => (
        <option key={range} value={range}>
          {label}
        </option>
      ))}
    </Select>
  );
}
