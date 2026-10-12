import dayjs, { type ManipulateType } from "dayjs";
import { Filter, nip19 } from "nostr-tools";

const TIME_UNITS = {
  h: "hour",
  w: "week",
  m: "minute",
  s: "second",
  d: "day",
} as const satisfies Record<string, ManipulateType>;

type TimeUnitLetter = keyof typeof TIME_UNITS;

function isTimeUnitLetter(letter: string): letter is TimeUnitLetter {
  return Object.hasOwn(TIME_UNITS, letter);
}

/**
 * Maps a relative-date unit letter (any case) to a dayjs unit, defaulting to hours when absent.
 * Throws for a letter missing from TIME_UNITS, so the table and the regex in processDateString cannot drift apart silently.
 */
export function parseTimeUnit(letter: string | undefined): ManipulateType {
  if (!letter) return "hour";
  const lower = letter.toLowerCase();
  if (!isTimeUnitLetter(lower)) throw new Error(`Unknown time unit ${letter}`);
  return TIME_UNITS[lower];
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
