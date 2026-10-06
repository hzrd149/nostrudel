import { forwardRef, LegacyRef, useMemo, useRef } from "react";
// NOTE: Do not remove Textarea or Input from the imports. they are used
import { Image, Input, InputProps, Spinner, Textarea, TextareaProps } from "@chakra-ui/react";
import { type EmojiMartData } from "@emoji-mart/data";
import ReactTextareaAutocomplete, {
  ItemComponentProps,
  TextareaProps as ReactTextareaAutocompleteProps,
  TriggerType,
} from "@webscopeio/react-textarea-autocomplete";
import "@webscopeio/react-textarea-autocomplete/style.css";
import { matchSorter } from "match-sorter";
import { nip19 } from "nostr-tools";
import { useAsync, useLocalStorage } from "react-use";

import { debounce } from "../helpers/function";

import { useContextEmojis } from "../providers/global/emoji-provider";
import { sortByDistanceAndConnections } from "../services/social-graph";
import { lookupUsers, SearchResult } from "../services/user-lookup";
import UserAvatar from "./user/user-avatar";
import UserDnsIdentity from "./user/user-dns-identity";
import UserName from "./user/user-name";

export type PeopleToken = SearchResult;
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
        <span style={{ background: "transparent" }}>
          {name}:{" "}
          <Image src={url} h="1.2em" w="1.2em" display="inline-block" verticalAlign="middle" title={name} alt={name} />
        </span>
      );
    else return <span style={{ background: "transparent" }}>{`${name}: ${char}`}</span>;
  } else if (isPersonToken(entity)) {
    return (
      <span style={{ background: "transparent" }}>
        <UserAvatar pubkey={entity.pubkey} size="xs" /> <UserName pubkey={entity.pubkey} />{" "}
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
>["loadingComponent"] = ({ data: _data }) => (
  <div style={{ padding: "8px", background: "var(--chakra-colors-chakra-body-bg)", textAlign: "center" }}>
    <Spinner size="sm" />
  </div>
);

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
  const emojis = useEmojiTokens();

  // Create a stable reference to the lookup function that will be debounced
  const lookupFunctionRef = useRef(async (token: string) => {
    const results = await lookupUsers(token.trim(), 10);
    return sortByDistanceAndConnections(results, (r) => r.pubkey);
  });

  // Create a debounced version - note: debounce wraps the result in a Promise
  const debouncedLookupRef = useRef(debounce(lookupFunctionRef.current, 300));

  const triggers: TriggerType<Token> = useMemo(
    () => ({
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
          // Require at least 3 characters before searching
          if (token.trim().length < 3) return [];
          return await debouncedLookupRef.current(token);
        },
        component: Item,
        output,
      },
    }),
    [emojis],
  );

  return triggers;
}

/** Chakra's responsive `color` prop clashes with the HTML attribute the autocomplete library's props generic is constrained to */
type AutocompleteTextareaProps = Omit<TextareaProps, "color">;

export type RefType = ReactTextareaAutocomplete<Token, AutocompleteTextareaProps>;

// Shared props factory for MagicInput/MagicTextArea; only the element and default label differ.
function createAutocompleteProps<E, R>(
  textAreaComponent: E,
  defaultAriaLabel: string,
  triggers: TriggerType<Token>,
  ref: React.Ref<R> | undefined,
  ariaLabel: string | undefined,
) {
  return {
    textAreaComponent,
    loadingComponent: Loading,
    minChar: 0,
    trigger: triggers,
    innerRef: ref
      ? typeof ref === "function"
        ? ref
        : (el: R) => ((ref as React.MutableRefObject<R>).current = el)
      : undefined,
    "aria-label": ariaLabel || defaultAriaLabel,
    role: "combobox" as const,
    "aria-autocomplete": "list" as const,
    "aria-expanded": "false" as const,
  };
}

const MagicInput = forwardRef<HTMLInputElement, InputProps & { instanceRef?: LegacyRef<RefType> }>(
  ({ instanceRef, ...props }, ref) => {
    const triggers = useAutocompleteTriggers();

    return (
      // aislop-ignore-next-line ai-slop/ts-directive -- the autocomplete library constrains its props generic to textarea attributes while MagicInput deliberately renders a Chakra Input whose props and handlers are typed for HTMLInputElement, so no props type satisfies the library's own typings
      // @ts-expect-error -- TS2344: InputProps does not satisfy TextareaHTMLAttributes<HTMLTextAreaElement> because onChange is ChangeEventHandler<HTMLInputElement>
      <ReactTextareaAutocomplete<Token, InputProps>
        {...props}
        ref={instanceRef}
        {...createAutocompleteProps(Input, "Input with autocomplete", triggers, ref, props["aria-label"])}
      />
    );
  },
);

const MagicTextArea = forwardRef<HTMLTextAreaElement, TextareaProps & { instanceRef?: LegacyRef<RefType> }>(
  ({ instanceRef, ...props }, ref) => {
    const triggers = useAutocompleteTriggers();

    return (
      <ReactTextareaAutocomplete<Token, AutocompleteTextareaProps>
        {...props}
        ref={instanceRef}
        {...createAutocompleteProps(Textarea, "Textarea with autocomplete", triggers, ref, props["aria-label"])}
      />
    );
  },
);

MagicTextArea.displayName = "MagicTextArea";

export { MagicTextArea as default, MagicInput };
