import _throttle from "lodash.throttle";
import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import { SearchDirectory, userSearchDirectory } from "../../../services/username-search";

let users: SearchDirectory = [];
export function codeMirrorUserAutocomplete(context: CompletionContext): CompletionResult | null {
  let nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);
  if (nodeBefore.name !== "String") return null;

  let textBefore = context.state.sliceDoc(nodeBefore.from, context.pos);
  let tagBefore = /@\w*$/.exec(textBefore);
  if (!tagBefore && !context.explicit) return null;

  return {
    from: tagBefore ? nodeBefore.from + tagBefore.index : context.pos,
    validFor: /^(@\w*)?$/,
    // options: tagOptions,
    options: users
      .filter((u) => !!u.names[0])
      .map((user) => ({
        label: "@" + user.names[0]!,
        type: "keyword",
        apply: user.pubkey,
        detail: "pubkey",
      })),
  };
}

userSearchDirectory.subscribe((directory) => {
  users = directory;
});
