import dayjs, { type ManipulateType } from "dayjs";
import { Filter, nip19 } from "nostr-tools";

const TIME_UNITS: Record<string, ManipulateType> = {
  h: "hour",
  w: "week",
  m: "minute",
  s: "second",
  d: "day",
};

/** Maps a relative-date unit letter (any case) to a dayjs unit, defaulting to hours when absent. */
export function parseTimeUnit(letter: string | undefined): ManipulateType {
  if (!letter) return "hour";
  return TIME_UNITS[letter.toLowerCase()] ?? "hour";
}

export function processDateString(date: string) {
  if (date.toLowerCase() === "now" || date.toLowerCase() === "n") {
    return dayjs().unix();
  } else if (date.startsWith("n")) {
    const match = date.match(/n([+-])(\d+)([hwmsd])?/i);
    if (match === null) throw new Error(`Cant parse relative date string ${date}`);

    if (match[1] === "-") {
      return dayjs().subtract(parseInt(match[2]), parseTimeUnit(match[3])).unix();
    } else if (match[1] === "+") {
      return dayjs().add(parseInt(match[2]), parseTimeUnit(match[3])).unix();
    } else throw Error(`Unknown operation ${match[1]}`);
  }

  throw new Error(`Unknown date string ${date}`);
}

export async function processFilter(f: Filter): Promise<Filter> {
  const filter = JSON.parse(JSON.stringify(f)) as Filter;

  if (filter.authors)
    filter.authors = filter.authors.map((p) => {
      if (p.startsWith("npub")) return nip19.decode(p).data as string;
      return p;
    });

  if (typeof filter.since === "string") {
    filter.since = processDateString(filter.since);
  }
  if (typeof filter.until === "string") {
    filter.until = processDateString(filter.until);
  }

  return filter;
}
