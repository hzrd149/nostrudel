import React, { LegacyRef, forwardRef } from "react";
// NOTE: Do not remove Textarea or Input from the imports. they are used
import { Image, InputProps, Textarea, Input, TextareaProps } from "@chakra-ui/react";
import ReactTextareaAutocomplete, {
  ItemComponentProps,
  TextareaProps as ReactTextareaAutocompleteProps,
  TriggerType,
} from "@webscopeio/react-textarea-autocomplete";
import "@webscopeio/react-textarea-autocomplete/style.css";
import { nip19 } from "nostr-tools";
import { matchSorter } from "match-sorter";

import { Emoji, useContextEmojis } from "../providers/global/emoji-provider";
import { useUserSearchDirectoryContext } from "../providers/global/user-directory-provider";
import UserAvatar from "./user/user-avatar";
import { UserDnsIdentityIcon } from "./user/user-dns-identity-icon";

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
        <UserAvatar pubkey={entity.pubkey} size="xs" /> {entity.names[0]}{" "}
        <UserDnsIdentityIcon pubkey={entity.pubkey} onlyIcon />
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

const Loading: ReactTextareaAutocompleteProps<
  Token,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>["loadingComponent"] = ({ data }) => <div>Loading</div>;

function useAutocompleteTriggers() {
  const emojis = useContextEmojis();
  const getDirectory = useUserSearchDirectoryContext();

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
        const dir = await getDirectory();
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

const MagicInput = forwardRef<HTMLInputElement, InputProps & { instanceRef?: LegacyRef<RefType> }>(
  ({ instanceRef, ...props }, ref) => {
    const triggers = useAutocompleteTriggers();

    return (
      // @ts-ignore
      <ReactTextareaAutocomplete<Token, InputProps>
        {...props}
        textAreaComponent={Input}
        ref={instanceRef}
        loadingComponent={Loading}
        minChar={0}
        trigger={triggers}
        innerRef={ref && (typeof ref === "function" ? ref : (el) => (ref.current = el))}
      />
    );
  },
);

const MagicTextArea = forwardRef<HTMLTextAreaElement, TextareaProps & { instanceRef?: LegacyRef<RefType> }>(
  ({ instanceRef, ...props }, ref) => {
    const triggers = useAutocompleteTriggers();

    return (
      // @ts-ignore
      <ReactTextareaAutocomplete<Token, TextareaProps>
        {...props}
        ref={instanceRef}
        textAreaComponent={Textarea}
        loadingComponent={Loading}
        minChar={0}
        trigger={triggers}
        innerRef={ref && (typeof ref === "function" ? ref : (el) => (ref.current = el))}
      />
    );
  },
);

export { MagicInput, MagicTextArea as default };
