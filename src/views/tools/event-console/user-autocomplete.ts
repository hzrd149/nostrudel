import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import { lookupUsers, SearchResult } from "../../../services/username-search";

let cachedUsers: SearchResult[] = [];
let lastQuery = "";
let lookupPromise: Promise<void> | null = null;

export function codeMirrorUserAutocomplete(context: CompletionContext): CompletionResult | null {
  const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);
  if (nodeBefore.name !== "String") return null;

  const textBefore = context.state.sliceDoc(nodeBefore.from, context.pos);
  const tagBefore = /@\w*$/.exec(textBefore);
  if (!tagBefore && !context.explicit) return null;

  const query = tagBefore ? textBefore.slice(tagBefore.index + 1) : "";

  // Trigger async lookup if query changed
  if (query !== lastQuery && query.length >= 2) {
    lastQuery = query;
    lookupPromise = lookupUsers(query, 20).then((results) => {
      cachedUsers = results;
    });
  }

  return {
    from: tagBefore ? nodeBefore.from + tagBefore.index : context.pos,
    validFor: /^(@\w*)?$/,
    options: cachedUsers.map((user) => ({
      label: "@" + user.query,
      type: "keyword",
      apply: user.pubkey,
      detail: "pubkey",
    })),
  };
}
