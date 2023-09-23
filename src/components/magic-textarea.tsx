import React, { LegacyRef } from "react";
import { Image, InputProps, Textarea, TextareaProps, Input } from "@chakra-ui/react";
import ReactTextareaAutocomplete, {
  ItemComponentProps,
  TextareaProps as ReactTextareaAutocompleteProps,
  TriggerType,
} from "@webscopeio/react-textarea-autocomplete";
import "@webscopeio/react-textarea-autocomplete/style.css";
import { nip19 } from "nostr-tools";

import { matchSorter } from "match-sorter/dist/match-sorter.esm.js";
import { Emoji, useContextEmojis } from "../providers/emoji-provider";
import { UserDirectory, useUserDirectoryContext } from "../providers/user-directory-provider";
import { UserAvatar } from "./user-avatar";
import userMetadataService from "../services/user-metadata";

export type PeopleToken = { pubkey: string; names: string[] };
type Token = Emoji | PeopleToken;

function isEmojiToken(token: Token): token is Emoji {
  return Object.hasOwn(token, "char");
}
function isPersonToken(token: Token): token is PeopleToken {
  return Object.hasOwn(token, "pubkey");
}

const Item = ({ entity }: ItemComponentProps<Token>) => {
  if (isEmojiToken(entity)) {
    const { url, name, char } = entity;
    if (url)
      return (
        <span>
          {name}: <Image src={url} h="1.2em" w="1.2em" display="inline-block" verticalAlign="middle" title={name} />
        </span>
      );
    else return <span>{`${name}: ${char}`}</span>;
  } else if (isPersonToken(entity)) {
    return (
      <span>
        <UserAvatar pubkey={entity.pubkey} size="xs" /> {entity.names[0]}
      </span>
    );
  } else return null;
};

function output(token: Token) {
  if (isEmojiToken(token)) {
    return token.char;
  } else if (isPersonToken(token)) {
    return "nostr:" + nip19.npubEncode(token.pubkey);
  } else return "";
}

function getUsersFromDirectory(directory: UserDirectory) {
  const people: PeopleToken[] = [];
  for (const pubkey of directory) {
    const metadata = userMetadataService.getSubject(pubkey).value;
    if (!metadata) continue;
    const names: string[] = [];
    if (metadata.display_name) names.push(metadata.display_name);
    if (metadata.name) names.push(metadata.name);
    if (names.length > 0) {
      people.push({ pubkey, names });
    }
  }
  return people;
}

const Loading: ReactTextareaAutocompleteProps<
  Token,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>["loadingComponent"] = ({ data }) => <div>Loading</div>;

function useAutocompleteTriggers() {
  const emojis = useContextEmojis();
  const getDirectory = useUserDirectoryContext();

  const triggers: TriggerType<Token> = {
    ":": {
      dataProvider: (token: string) => {
        return matchSorter(emojis, token.trim(), { keys: ["keywords"] }).slice(0, 10);
      },
      component: Item,
      output,
    },
    "@": {
      dataProvider: async (token: string) => {
        const dir = getUsersFromDirectory(await getDirectory());
        return matchSorter(dir, token.trim(), { keys: ["names"] }).slice(0, 10);
      },
      component: Item,
      output,
    },
  };

  return triggers;
}

// @ts-ignore
export type RefType = ReactTextareaAutocomplete<Token, TextareaProps>;

export function MagicInput({ instanceRef, ...props }: InputProps & { instanceRef?: LegacyRef<RefType> }) {
  const triggers = useAutocompleteTriggers();

  return (
    // @ts-ignore
    <ReactTextareaAutocomplete<Token, InputProps>
      {...props}
      textAreaComponent={Input}
      ref={instanceRef}
      loadingComponent={Loading}
      renderToBody
      minChar={0}
      trigger={triggers}
    />
  );
}

export default function MagicTextArea({ instanceRef, ...props }: TextareaProps & { instanceRef?: LegacyRef<RefType> }) {
  const triggers = useAutocompleteTriggers();

  return (
    // @ts-ignore
    <ReactTextareaAutocomplete<Token, TextareaProps>
      {...props}
      ref={instanceRef}
      textAreaComponent={Textarea}
      loadingComponent={Loading}
      renderToBody
      minChar={0}
      trigger={triggers}
    />
  );
}
