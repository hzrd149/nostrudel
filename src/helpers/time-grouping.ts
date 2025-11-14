import dayjs from "dayjs";

export type TimePeriod = {
  key: string;
  label: string;
  /** Unix timestamp representing this period (used for display) */
  timestamp: number;
  /**
   * Threshold timestamp - items with timestamp >= this value belong to this period
   * Periods should be ordered from most recent to oldest
   * The last period acts as a catch-all for anything older
   */
  threshold: number;
};

/**
 * Default time periods: Today, Yesterday, Last Week, Last Month, Earlier
 * Periods are ordered from most recent to oldest
 */
export function getDefaultTimePeriods(): TimePeriod[] {
  const now = dayjs();

  return [
    {
      key: "today",
      label: "Today",
      timestamp: now.startOf("day").unix(),
      threshold: now.startOf("day").unix(),
    },
    {
      key: "yesterday",
      label: "Yesterday",
      timestamp: now.subtract(1, "day").startOf("day").unix(),
      threshold: now.subtract(1, "day").startOf("day").unix(),
    },
    {
      key: "lastWeek",
      label: "Last Week",
      timestamp: now.subtract(7, "day").startOf("day").unix(),
      threshold: now.subtract(7, "day").startOf("day").unix(),
    },
    {
      key: "lastMonth",
      label: "Last Month",
      timestamp: now.subtract(30, "day").startOf("day").unix(),
      threshold: now.subtract(30, "day").startOf("day").unix(),
    },
    {
      key: "earlier",
      label: "Earlier",
      timestamp: now.subtract(365, "day").startOf("day").unix(),
      threshold: 0, // Catch-all for everything older
    },
  ];
}

export type TimeGroupedListItem<T> =
  | { type: "header"; timestamp: number; key: string; label: string }
  | { type: "item"; item: T; key: string };

/**
 * Generic function to group items by time period and flatten into a list with headers
 * @param items - Array of items to group
 * @param getTimestamp - Function to extract timestamp from an item
 * @param getKey - Function to generate a unique key for an item
 * @param timePeriods - Optional array of custom time periods (ordered from most recent to oldest).
 *                      If not provided, uses default periods.
 * @returns Flattened array with time period headers and items
 */
export function groupByTimePeriod<T>(
  items: T[],
  getTimestamp: (item: T) => number,
  getKey: (item: T) => string,
  timePeriods?: TimePeriod[],
): TimeGroupedListItem<T>[] {
  if (items.length === 0) return [];

  const periods = timePeriods ?? getDefaultTimePeriods();

  // Group by time period
  const periodGroups = new Map<string, T[]>();

  for (const item of items) {
    const timestamp = getTimestamp(item);

    // Find the first period where timestamp >= threshold
    // Periods are ordered from most recent to oldest
    const matchingPeriod = periods.find((period) => timestamp >= period.threshold);

    if (matchingPeriod) {
      if (!periodGroups.has(matchingPeriod.key)) {
        periodGroups.set(matchingPeriod.key, []);
      }
      periodGroups.get(matchingPeriod.key)!.push(item);
    }
  }

  // Flatten into list items with headers (in the order of periods array)
  const result: TimeGroupedListItem<T>[] = [];
  for (const period of periods) {
    const periodItems = periodGroups.get(period.key);
    if (periodItems && periodItems.length > 0) {
      // Add header
      result.push({
        type: "header",
        timestamp: period.timestamp,
        key: `header-${period.key}`,
        label: period.label,
      });

      // Add items
      for (const item of periodItems) {
        result.push({
          type: "item",
          item,
          key: `item-${getKey(item)}`,
        });
      }
    }
  }

  return result;
}
