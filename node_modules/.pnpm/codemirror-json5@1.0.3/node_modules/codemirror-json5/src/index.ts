import {
  continuedIndent,
  foldInside,
  foldNodeProp,
  indentNodeProp,
  LanguageSupport,
  LRLanguage,
} from '@codemirror/language';
import type { Diagnostic } from '@codemirror/lint';
import { StateField, type Text, type Transaction } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';
import { styleTags, tags as t } from '@lezer/highlight';
import JSON5 from 'json5';
import { parser } from 'lezer-json5';
import { getPathAtNode, nodeAtCursor } from './editor';

/** A language provider that provides JSON5 parsing. */
export const json5Language = LRLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Object: continuedIndent({ except: /^\s*\}/ }),
        Array: continuedIndent({ except: /^\s*\]/ }),
      }),
      foldNodeProp.add({
        'Object Array': foldInside,
      }),
      styleTags({
        String: t.string,
        'PropertyName!': t.propertyName,
        Number: t.number,
        'True False': t.bool,
        Null: t.null,
        LineComment: t.lineComment,
        BlockComment: t.blockComment,
        ', PropertyColon': t.separator,
        '[ ]': t.squareBracket,
        '{ }': t.brace,
      }),
    ],
  }),
  languageData: {
    closeBrackets: { brackets: ['[', '{', '"', `'`] },
    indentOnInput: /^\s*[}\]]$/,
    commentTokens: {
      line: '//',
      block: {
        open: '/*',
        clone: '*/',
      },
    },
  },
});

/** JSON5 language support, with the json5ParseCache and jsonCursorPath extensions enabled. */
export function json5() {
  return new LanguageSupport(json5Language, [json5ParseCache.extension, jsonCursorPath.extension]);
}

/** A function to provide additional linting functionality on the parsed version of the object */
export type StructureLinter<T = unknown> = (
  view: EditorView,
  parsed: T
) => Diagnostic[] | Promise<Diagnostic[]>;

interface Json5SyntaxError extends SyntaxError {
  lineNumber: number;
  columnNumber: number;
}

function handleParseError(doc: Text, e: Error | Json5SyntaxError): Diagnostic[] {
  let pos = 0;
  if ('lineNumber' in e && 'columnNumber' in e) {
    pos = Math.min(doc.line(e.lineNumber).from + e.columnNumber - 1, doc.length);
  }

  return [
    {
      from: pos,
      to: pos,
      message: e.message,
      severity: 'error',
    },
  ];
}

/**
 * JSON5 linting support
 *
 * @param structureLinter Perform additional linting on the parsed object
 **/
export function json5ParseLinter<T = unknown>(structureLinter?: StructureLinter<T>) {
  return (view: EditorView): Diagnostic[] | Promise<Diagnostic[]> => {
    let doc = view.state.doc;
    let cached = view.state.field(json5ParseCache, false);

    if (cached) {
      if (cached.err) {
        return handleParseError(doc, cached.err);
      } else if (cached.obj !== undefined) {
        return structureLinter?.(view, cached.obj as T) ?? [];
      }
    }

    try {
      let parsed = JSON5.parse(doc.toString());
      return structureLinter?.(view, parsed) ?? [];
    } catch (e: unknown) {
      return handleParseError(doc, e as Json5SyntaxError);
    }
  };
}

/** The parsed JSON5 value from the editor buffer */
export interface Json5ParseCache {
  err: Json5SyntaxError | null;
  obj: unknown | undefined;
}

/** A cache to allow linters, autocomplete, etc. to not have to parse the
 * same text over and over again. */
export const json5ParseCache = StateField.define<Json5ParseCache | null>({
  create() {
    return null;
  },
  update(oldValue, tx: Transaction) {
    if (!tx.docChanged) {
      return oldValue;
    }

    try {
      let parsed = JSON5.parse(tx.newDoc.toString());
      return { err: null, obj: parsed };
    } catch (e: unknown) {
      return {
        err: e as Json5SyntaxError,
        obj: oldValue?.obj,
      };
    }
  },
});

export interface JsonCursorPath {
  path: (string | number)[] | null;
  node: SyntaxNode | null;
}

/** jsonCursorPath calculates the path inside the JSON5 object that the cursor is over, and exposes
* that as a state field. */
export const jsonCursorPath = StateField.define<JsonCursorPath>({
  create() {
    return { path: null, node: null };
  },
  update(oldValue, tx: Transaction) {
    let cursorPos = tx.state.selection.main.to;
    let currentNode = nodeAtCursor(tx.state, cursorPos);
    let currentPath = currentNode ? getPathAtNode(tx.state, currentNode) : null;
    return {
      path: currentPath ?? null,
      node: currentNode,
    };
  },
});
