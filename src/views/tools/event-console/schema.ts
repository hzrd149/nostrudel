import { type JSONSchema7 } from "json-schema";
import { kinds } from "nostr-tools";

const kindNumbers = Object.values(kinds).filter((t) => typeof t === "number") as number[];

const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const NostrFilterSchema: JSONSchema7 = {
  type: "object",
  properties: {
    ids: {
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: {
        type: "string",
      },
    },
    kinds: {
      type: "array",
      description: "Filter by event kind",
      minItems: 1,
      uniqueItems: true,
      items: {
        type: "integer",
        minimum: 0,
        examples: kindNumbers,
      },
    },
    authors: {
      type: "array",
      description: "Filter by pubkey",
      minItems: 1,
      uniqueItems: true,
      items: {
        type: "string",
      },
    },
    limit: {
      type: "integer",
      description: "max number of events to return",
      default: 20,
      minimum: 0,
    },
    until: {
      description: "Return events before or on this date",
      oneOf: [
        {
          type: "integer",
          minimum: 0,
        },
        { type: "string" },
      ],
    },
    since: {
      description: "Return events after or on this date",
      oneOf: [
        {
          type: "integer",
          minimum: 0,
        },
        { type: "string" },
      ],
    },
  },
};

for (const letter of letters) {
  NostrFilterSchema.properties!["#" + letter] = {
    type: "array",
    description: `Filter on ${letter} tag`,
    items: {
      type: "string",
    },
  };
}
