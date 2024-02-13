import { type JSONSchema7 } from "json-schema";

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
    },
    until: {
      type: "integer",
      description: "Return events before or on this date",
    },
    since: {
      type: "integer",
      description: "Return events after or on this date",
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
