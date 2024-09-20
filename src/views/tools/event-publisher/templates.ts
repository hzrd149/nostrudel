import { kinds } from "nostr-tools";
import { LooseEventTemplate, Variable } from "./process";

export const TEMPLATES: { name: string; variables: Variable[]; template: () => LooseEventTemplate }[] = [
  {
    name: "Short Text Note",
    variables: [],
    template: () => ({
      kind: kinds.ShortTextNote,
      content: "Hello World",
      created_at: "now",
      tags: [],
    }),
  },
  {
    name: "Live Stream",
    variables: [
      { type: "enum", name: "status", value: "live", options: ["live", "ended"] },
      { type: "timestamp", name: "starts", value: "" },
      { type: "string", name: "streaming", input: "url", placeholder: "https://example.com/stream.m3u8", value: "" },
      { type: "string", name: "image", input: "url", placeholder: "https://example.com/stream-image.png", value: "" },
    ],
    template: () => ({
      content: "",
      created_at: "now",
      kind: kinds.LiveEvent,
      tags: [
        ["d", "{{id}}"],
        ["title", "{{title}}"],
        ["summary", "{{summary}}"],
        ["streaming", "{{streaming}}"],
        ["status", "{{status}}"],
        ["starts", "{{starts}}"],
        ["image", "{{image}}"],
      ],
    }),
  },
];
