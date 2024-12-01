# codemirror-json5

This package implements JSON5 support for Codemirror 6.

Beyond the basic support, it provides a linter and state fields that expose:

- The parsed object produced by the JSON5 parser, so that your surrounding code can use that result instead of parsing it twice.
- The path in the object that the cursor is on.

## Usage

```javascript
import { json5, json5ParseLinter } from 'codemirror-json5';
import { linter } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

const view = new EditorView({
  state: EditorState.create({
    doc: `{ a_doc: 'goes here' }`,
    extensions: [
      json5(),
      linter(json5ParseLinter()),
    ]
  })
});
```

## Retrieving Editor State

```typescript
import { EditorState } from '@codemirror/state';
import { jsonCursorPath, json5ParseCache } from 'codemirror-json5';
import get from 'just-safe-get';

function getJson5Info(state: EditorState) {
  const object = state.field(json5ParseCache);
  const { path } = state.field(jsonCursorPath);

  return {
    parsed: object.obj,
    parseError: object.err,
    cursorPath: path,
    cursorValue: get(object.obj ?? {}, path),
  };
}
```
