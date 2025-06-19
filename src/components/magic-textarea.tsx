import { LegacyRef, forwardRef, useMemo } from "react";
// NOTE: Do not remove Textarea or Input from the imports. they are used
import { Image, Input, InputProps, Textarea, TextareaProps } from "@chakra-ui/react";
import { type EmojiMartData } from "@emoji-mart/data";
import ReactTextareaAutocomplete, {
  ItemComponentProps,
  TextareaProps as ReactTextareaAutocompleteProps,
  TriggerType,
} from "@webscopeio/react-textarea-autocomplete";
import "@webscopeio/react-textarea-autocomplete/style.css";
import { useObservableState } from "applesauce-react/hooks";
import { matchSorter } from "match-sorter";
import { nip19 } from "nostr-tools";
import { useAsync, useLocalStorage } from "react-use";

import { useContextEmojis } from "../providers/global/emoji-provider";
import { sortByDistanceAndConnections } from "../services/social-graph";
import { userSearchDirectory } from "../services/username-search";
import UserAvatar from "./user/user-avatar";
import UserDnsIdentity from "./user/user-dns-identity";

// Referencing Textarea and Input so they are not removed from the imports
[Textarea, Input];

export type PeopleToken = { pubkey: string; names: string[] };
export type EmojiToken = { id: string; name: string; keywords: string[]; char: string; url?: string };
type Token = EmojiToken | PeopleToken;

function isEmojiToken(token: Token): token is EmojiToken {
  return Reflect.has(token, "char");
}
function isPersonToken(token: Token): token is PeopleToken {
  return Reflect.has(token, "pubkey");
}

const Item = ({ entity }: ItemComponentProps<Token>) => {
  if (isEmojiToken(entity)) {
    const { url, name, char } = entity;
    if (url)
      return (
        <span role="option" aria-label={`Emoji: ${name}`}>
          {name}:{" "}
          <Image src={url} h="1.2em" w="1.2em" display="inline-block" verticalAlign="middle" title={name} alt={name} />
        </span>
      );
    else return <span role="option" aria-label={`Emoji: ${name}`}>{`${name}: ${char}`}</span>;
  } else if (isPersonToken(entity)) {
    return (
      <span role="option" aria-label={`User: ${entity.names[0]}`}>
        <UserAvatar pubkey={entity.pubkey} size="xs" /> {entity.names[0]}{" "}
        <UserDnsIdentity pubkey={entity.pubkey} onlyIcon />
      </span>
    );
  } else return null;
};

function output(token: Token) {
  if (isEmojiToken(token)) {
    return token.char || "";
  } else if (isPersonToken(token)) {
    return "nostr:" + nip19.npubEncode(token.pubkey) || "";
  } else return "";
}

// NOTE: Do not remove this, it is in the text area autocomplete
const Loading: ReactTextareaAutocompleteProps<
  Token,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>["loadingComponent"] = ({ data }) => <div>Loading</div>;

function useEmojiTokens() {
  const customEmojis = useContextEmojis();
  const customEmojiTokens = useMemo(
    () =>
      customEmojis.map(
        (emoji) =>
          ({
            id: emoji.shortcode,
            name: emoji.shortcode,
            url: emoji.url,
            keywords: [emoji.shortcode],
            char: `:${emoji.shortcode}:`,
          }) satisfies EmojiToken,
      ),
    [customEmojis],
  );

  const { value: native } = useAsync(() => import("@emoji-mart/data") as Promise<{ default: EmojiMartData }>);
  const nativeEmojisTokens = useMemo(() => {
    if (!native) return [];

    return Object.values(native.default.emojis).map(
      (emoji) =>
        ({
          id: emoji.id,
          name: emoji.name,
          keywords: [emoji.id, emoji.name, ...emoji.keywords],
          char: emoji.skins[0].native,
        }) satisfies EmojiToken,
    );
  }, [native]);

  // load local reaction frequency
  const [frequently] = useLocalStorage("emoji-mart.frequently", {} as Record<string, number>, {
    raw: false,
    serializer: (v) => JSON.stringify(v),
    deserializer: (str) => JSON.parse(str),
  });

  return useMemo(() => {
    const all = [...nativeEmojisTokens, ...customEmojiTokens];

    if (frequently) return all.sort((a, b) => (frequently[b.id] ?? 0) - (frequently[a.id] ?? 0));
    else return all;
  }, [nativeEmojisTokens, customEmojiTokens]);
}

function useAutocompleteTriggers() {
  const directory = useObservableState(userSearchDirectory) ?? [];
  const emojis = useEmojiTokens();

  const triggers: TriggerType<Token> = {
    ":": {
      dataProvider: (token: string) => {
        if (!token) return emojis.slice(0, 10);
        else return matchSorter(emojis, token.trim(), { keys: ["keywords"] }).slice(0, 10);
      },
      component: Item,
      output,
    },
    "@": {
      dataProvider: async (token: string) => {
        return matchSorter(directory, token.trim(), {
          keys: ["names"],
          sorter: (items) =>
            sortByDistanceAndConnections(
              items.sort((a, b) => b.rank - a.rank),
              (i) => i.item.pubkey,
            ),
        }).slice(0, 10);
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
      // @ts-expect-error
      <ReactTextareaAutocomplete<Token, InputProps>
        {...props}
        textAreaComponent={Input}
        ref={instanceRef}
        loadingComponent={Loading}
        minChar={0}
        trigger={triggers}
        innerRef={ref && (typeof ref === "function" ? ref : (el) => (ref.current = el))}
        aria-label={props["aria-label"] || "Input with autocomplete"}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded="false"
      />
    );
  },
);

const MagicTextArea = forwardRef<HTMLTextAreaElement, TextareaProps & { instanceRef?: LegacyRef<RefType> }>(
  ({ instanceRef, ...props }, ref) => {
    const triggers = useAutocompleteTriggers();

    return (
      // @ts-expect-error
      <ReactTextareaAutocomplete<Token, TextareaProps>
        {...props}
        ref={instanceRef}
        textAreaComponent={Textarea}
        loadingComponent={Loading}
        minChar={0}
        trigger={triggers}
        innerRef={ref && (typeof ref === "function" ? ref : (el) => (ref.current = el))}
        aria-label={props["aria-label"] || "Textarea with autocomplete"}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded="false"
      />
    );
  },
);

MagicTextArea.displayName = "MagicTextArea";

export { MagicInput, MagicTextArea as default };
