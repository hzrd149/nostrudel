import React from "react";
import { Image, Textarea, TextareaProps } from "@chakra-ui/react";
import ReactTextareaAutocomplete, {
  ItemComponentProps,
  TextareaProps as ReactTextareaAutocompleteProps,
} from "@webscopeio/react-textarea-autocomplete";
import "@webscopeio/react-textarea-autocomplete/style.css";

import { matchSorter } from "match-sorter/dist/match-sorter.esm.js";
import { Emoji, useContextEmojis } from "../providers/emoji-provider";

const Item = ({ entity: { name, char, url } }: ItemComponentProps<Emoji>) => {
  if (url)
    return (
      <span>
        {name}: <Image src={url} h="1.2em" w="1.2em" display="inline-block" verticalAlign="middle" title={name} />
      </span>
    );
  else return <span>{`${name}: ${char}`}</span>;
};
const Loading: ReactTextareaAutocompleteProps<
  Emoji,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>["loadingComponent"] = ({ data }) => <div>Loading</div>;

export default function MagicTextArea({ ...props }: TextareaProps) {
  const emojis = useContextEmojis();

  return (
    <Textarea
      {...props}
      as={ReactTextareaAutocomplete<Emoji>}
      loadingComponent={Loading}
      renderToBody
      minChar={0}
      trigger={{
        ":": {
          dataProvider: (token: string) => {
            return matchSorter(emojis, token.trim(), { keys: ["keywords"] }).slice(0, 10);
          },
          component: Item,
          output: (item: Emoji) => item.char,
        },
      }}
    />
  );
}
