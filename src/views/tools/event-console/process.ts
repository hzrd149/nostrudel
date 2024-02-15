import dayjs from "dayjs";
import { Filter, nip19 } from "nostr-tools";

function processDateString(date: string) {
  if (date.startsWith("n")) {
    const match = date.match(/n([+-])(\d+)([hwmsd])?/i);
    if (match === null) throw new Error(`Cant parse relative date string ${date}`);

    if (match[1] === "-") {
      return (
        dayjs()
          // @ts-expect-error
          .subtract(parseInt(match[2]), match[3] || "h")
          .unix()
      );
    } else if (match[1] === "+") {
      return (
        dayjs()
          // @ts-expect-error
          .add(parseInt(match[2]), match[3] || "h")
          .unix()
      );
    } else throw Error(`Unknown operation ${match[1]}`);
  } else if (date.toLowerCase() === "now") {
    return dayjs().unix();
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
