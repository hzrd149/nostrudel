import { Filter } from "nostr-tools";

function mapParams(params: any[]) {
  return `(${params.map(() => "?").join(", ")})`;
}

function isFilterKeyIndexableTag(key: string) {
  return key[0] === "#" && key.length === 2;
}
function isFilterKeyIndexableAndTag(key: string) {
  return key[0] === "&" && key.length === 2;
}

function buildConditionsForFilter(filter: Filter) {
  const joins: string[] = [];
  const conditions: string[] = [];
  const parameters: (string | number)[] = [];
  const groupBy: string[] = [];
  const having: string[] = [];

  // get AND tag filters
  const andTagQueries = Object.keys(filter).filter(isFilterKeyIndexableAndTag);
  // get OR tag filters and remove any ones that appear in the AND
  const orTagQueries = Object.keys(filter)
    .filter(isFilterKeyIndexableTag)
    .filter((t) => !andTagQueries.includes(t));

  if (orTagQueries.length > 0) {
    joins.push("INNER JOIN tags as or_tags ON events.id = or_tags.event");
  }
  if (andTagQueries.length > 0) {
    joins.push("INNER JOIN tags as and_tags ON events.id = and_tags.event");
  }
  if (filter.search) {
    joins.push("INNER JOIN events_fts ON events_fts.id = events.id");

    conditions.push(`events_fts MATCH ?`);
    parameters.push('"' + filter.search.replace(/"/g, '""') + '"');
  }

  if (typeof filter.since === "number") {
    conditions.push(`events.created_at >= ?`);
    parameters.push(filter.since);
  }

  if (typeof filter.until === "number") {
    conditions.push(`events.created_at < ?`);
    parameters.push(filter.until);
  }

  if (filter.ids) {
    conditions.push(`events.id IN ${mapParams(filter.ids)}`);
    parameters.push(...filter.ids);
  }

  if (filter.kinds) {
    conditions.push(`events.kind IN ${mapParams(filter.kinds)}`);
    parameters.push(...filter.kinds);
  }

  if (filter.authors) {
    conditions.push(`events.pubkey IN ${mapParams(filter.authors)}`);
    parameters.push(...filter.authors);
  }

  // add AND tag filters
  for (const t of andTagQueries) {
    conditions.push(`and_tags.tag = ?`);
    parameters.push(t.slice(1));

    // @ts-expect-error
    const v = filter[t] as string[];
    conditions.push(`and_tags.value IN ${mapParams(v)}`);
    parameters.push(...v);
  }

  // add OR tag filters
  for (let t of orTagQueries) {
    conditions.push(`or_tags.tag = ?`);
    parameters.push(t.slice(1));

    // @ts-expect-error
    const v = filter[t] as string[];
    conditions.push(`or_tags.value IN ${mapParams(v)}`);
    parameters.push(...v);
  }

  // if there is an AND tag filter set GROUP BY so that HAVING can be used
  if (andTagQueries.length > 0) {
    groupBy.push("events.id");
    having.push("COUNT(and_tags.id) = ?");

    // @ts-expect-error
    parameters.push(andTagQueries.reduce((t, k) => t + (filter[k] as string[]).length, 0));
  }

  return { conditions, parameters, joins, groupBy, having };
}

export function buildSQLQueryForFilters(filters: Filter[], select = "events.*") {
  let stmt = `SELECT ${select} FROM events `;

  const orConditions: string[] = [];
  const parameters: any[] = [];
  const groupBy = new Set<string>();
  const having = new Set<string>();

  let joins = new Set<string>();
  for (const filter of filters) {
    const parts = buildConditionsForFilter(filter);

    if (parts.conditions.length > 0) {
      orConditions.push(`(${parts.conditions.join(" AND ")})`);
      parameters.push(...parts.parameters);

      for (const join of parts.joins) joins.add(join);
      for (const group of parts.groupBy) groupBy.add(group);
      for (const have of parts.having) having.add(have);
    }
  }

  stmt += Array.from(joins).join(" ");

  if (orConditions.length > 0) {
    stmt += ` WHERE ${orConditions.join(" OR ")}`;
  }

  if (groupBy.size > 0) {
    stmt += " GROUP BY " + Array.from(groupBy).join(",");
  }
  if (having.size > 0) {
    stmt += " HAVING " + Array.from(having).join(" AND ");
  }

  // @ts-expect-error
  const order = filters.find((f) => f.order)?.order;
  if (filters.some((f) => f.search) && (order === "rank" || order === undefined)) {
    stmt = stmt + " ORDER BY rank";
  } else {
    stmt = stmt + " ORDER BY created_at DESC";
  }

  let minLimit = Infinity;
  for (const filter of filters) {
    if (filter.limit) minLimit = Math.min(minLimit, filter.limit);
  }
  if (minLimit !== Infinity) {
    stmt += " LIMIT ?";
    parameters.push(minLimit);
  }

  return { stmt, parameters };
}
