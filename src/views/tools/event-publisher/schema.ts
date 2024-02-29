import dayjs from "dayjs";
import { type JSONSchema7 } from "json-schema";

export const NostrEventSchema: JSONSchema7 = {
  type: "object",
  required: ["kind", "created_at", "tags", "content"],
  properties: {
    id: {
      type: "string",
      description: "The id of the event",
    },
    kind: {
      type: "integer",
      description: "The kind of event",
      minimum: 0,
    },
    pubkey: {
      type: "string",
      description: "The owner of the event",
    },
    created_at: {
      description: "The unix timestamp the event was created at",
      oneOf: [
        {
          type: "integer",
          minimum: 0,
          default: dayjs().unix(),
        },
        { type: "string" },
      ],
    },
    tags: {
      type: "array",
      description: "Event metadata tags",
      items: {
        type: "array",
        minItems: 1,
        items: {
          type: "string",
        },
      },
    },
  },
};
