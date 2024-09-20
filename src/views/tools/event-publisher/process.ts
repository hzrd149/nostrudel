import { EventTemplate, getEventHash, NostrEvent, UnsignedEvent } from "nostr-tools";
import Handlebars from "handlebars";

import { processDateString } from "../event-console/process";
import { Account } from "../../../classes/accounts/account";
import { InputProps } from "@chakra-ui/react";

type BaseVariable<T, V> = {
  type: T;
  name: string;
  value: string;
} & Partial<V>;
export type StringVar = BaseVariable<
  "string",
  {
    input: InputProps["type"];
    placeholder: string;
  }
>;
export type EnumVar = BaseVariable<
  "enum",
  {
    type: "enum";
    options: string[];
  }
>;
export type TimestampVar = BaseVariable<"timestamp", {}>;
export type PubkeyVar = BaseVariable<"pubkey", {}>;

export type Variable = StringVar | EnumVar | TimestampVar | PubkeyVar;

export type LooseEventTemplate = Omit<UnsignedEvent | NostrEvent | EventTemplate, "created_at"> & {
  created_at: number | string | undefined;
};

function getVariablesFromString(str: string) {
  if (str.length === 0) return;

  const matches = str.matchAll(/{{([^{}]+)}}/g);
  return Array.from(matches).map((match) => match[1].trim());
}
function setVariablesInString(str: string, variables: Record<string, any>) {
  if (!str.includes("{{")) return str;
  return Handlebars.compile(str)(variables);
}

export function getVariables(draft?: LooseEventTemplate) {
  if (!draft) return [];

  const variables: string[] = [];

  const add = (vars?: string[]) => {
    if (!vars) return;
    for (const v of vars) {
      if (!variables.includes(v)) variables.push(v);
    }
  };

  add(getVariablesFromString(draft.content));
  for (const tag of draft.tags) {
    for (const v of tag) {
      add(getVariablesFromString(v));
    }
  }

  return variables;
}

export function processEvent(draft: LooseEventTemplate, variables: Variable[], account: Account): UnsignedEvent {
  const event = { ...draft } as UnsignedEvent;

  const vars: Record<string, string> = variables.reduce((dir, v) => ({ ...dir, [v.name]: v.value }), {});

  event.content = setVariablesInString(event.content, vars);
  event.tags = event.tags.map((tag) => tag.map((v) => setVariablesInString(v, vars)));

  if (typeof event.created_at === "string") {
    event.created_at = processDateString(event.created_at);
  }

  event.pubkey = account.pubkey;

  // @ts-expect-error
  event.id = getEventHash(event);

  return event as UnsignedEvent;
}
