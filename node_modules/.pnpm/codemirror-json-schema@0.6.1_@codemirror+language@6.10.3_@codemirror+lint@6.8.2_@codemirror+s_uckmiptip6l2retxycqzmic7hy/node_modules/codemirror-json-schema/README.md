Codemirror 6 extensions that provide full [JSON Schema](https://json-schema.org/) support for `@codemirror/lang-json` & `codemirror-json5` language modes

<a href="https://npmjs.com/codemirror-json-schema">
<img alt="npm" src="https://img.shields.io/npm/dm/codemirror-json-schema?label=npm%20downloads">
</a>

![screenshot of the examples with json4 and json5 support enabled](./dev/public/example.png)

## Features

This is now a full-featured library for both json4 (aka json) and json5 using extensions, so they should compatible with any frontend framework and/or integration library

- ✅ validation messages
- ✅ autocompletion with insert text
- ✅ hover tooltips
- ✅ dynamic, per-editor-instance schemas using codemirror `StateField` and linting refresh

## Resources

- [Changelog](./CHANGELOG.md)
- [Comprehensive example](https://github.com/acao/cm6-json-schema/blob/main/dev/index.ts)
- [API Docs](./docs/)

## Usage

To give you as much flexibility as possible, everything codemirror related is a peer or optional dependency

Based on whether you want to support json4, json5 or both, you will need to install the relevant language mode for our library to use.

### Breaking Changes:

- 0.5.0 - this breaking change only impacts those following the "custom usage" approach, it _does not_ effect users using the high level, "bundled" `jsonSchema()` or `json5Schema()` modes. See the custom usages below to learn how to use the new `stateExtensions` and `handleRefresh` exports.

### json4

with `auto-install-peers true` or similar:

```
npm install --save @codemirror/lang-json codemirror-json-schema
```

without `auto-install-peers true`:

```
npm install --save @codemirror/lang-json codemirror-json-schema @codemirror/language @codemirror/lint @codemirror/view @codemirror/state @lezer/common
```

#### Minimal Usage

This sets up `@codemirror/lang-json` and our extension for you.
If you'd like to have more control over the related configurations, see custom usage below

```ts
import { EditorState } from "@codemirror/state";
import { jsonSchema } from "codemirror-json-schema";

const schema = {
  type: "object",
  properties: {
    example: {
      type: "boolean",
    },
  },
};

const json5State = EditorState.create({
  doc: "{ example: true }",
  extensions: [jsonSchema(schema)],
});
```

#### Custom Usage

This approach allows you to configure the json mode and parse linter, as well as our linter, hovers, etc more specifically.

```ts
import { EditorState } from "@codemirror/state";
import { linter } from "@codemirror/lint";
import { hoverTooltip } from "@codemirror/view";
import { json, jsonParseLinter, jsonLanguage } from "@codemirror/lang-json";

import {
  jsonSchemaLinter,
  jsonSchemaHover,
  jsonCompletion,
  stateExtensions,
  handleRefresh
} from "codemirror-json-schema";

const schema = {
  type: "object",
  properties: {
    example: {
      type: "boolean",
    },
  },
};

const state = EditorState.create({
  doc: `{ "example": true }`,
  extensions: [
    json(),
    linter(jsonParseLinter(), {
      // default is 750ms
      delay: 300
    }),
    linter(jsonSchemaLinter(), {
      needsRefresh: handleRefresh,
    }),
    jsonLanguage.data.of({
      autocomplete: jsonCompletion(),
    }),
    hoverTooltip(jsonSchemaHover()),
    stateExtensions(schema)
  ];
})
```

### json5

with `auto-install-peers true` or similar:

```
npm install --save codemirror-json5 codemirror-json-schema
```

without `auto-install-peers true`:

```
npm install --save codemirror-json5 codemirror-json-schema @codemirror/language @codemirror/lint @codemirror/view @codemirror/state @lezer/common
```

#### Minimal Usage

This sets up `codemirror-json5` mode for you.
If you'd like to have more control over the related configurations, see custom usage below

```ts
import { EditorState } from "@codemirror/state";
import { json5Schema } from "codemirror-json-schema/json5";

const schema = {
  type: "object",
  properties: {
    example: {
      type: "boolean",
    },
  },
};

const json5State = EditorState.create({
  doc: `{
    example: true,
    // json5 is awesome!
  }`,
  extensions: [json5Schema(schema)],
});
```

#### Custom Usage

This approach allows you to configure the json5 mode and parse linter, as well as our linter, hovers, etc more specifically.

```ts
import { EditorState } from "@codemirror/state";
import { linter } from "@codemirror/lint";
import { json5, json5ParseLinter, json5Language } from "codemirror-json5";
import {
  json5SchemaLinter,
  json5SchemaHover,
  json5Completion,
} from "codemirror-json-schema/json5";
import { stateExtensions, handleRefresh } from "codemirror-json-schema";

const schema = {
  type: "object",
  properties: {
    example: {
      type: "boolean",
    },
  },
};

const json5State = EditorState.create({
  doc: `{
    example: true,
    // json5 is awesome!
  }`,
  extensions: [
    json5(),
    linter(json5ParseLinter(), {
      // the default linting delay is 750ms
      delay: 300,
    }),
    linter(
      json5SchemaLinter({
        needsRefresh: handleRefresh,
      })
    ),
    hoverTooltip(json5SchemaHover()),
    json5Language.data.of({
      autocomplete: json5Completion(),
    }),
    stateExtensions(schema),
  ],
});
```

### Dynamic Schema

If you want to, you can provide schema dynamically, in several ways.
This works the same for either json or json5, using the underlying codemirror 6 StateFields, via the `updateSchema` method export.

In this example

- the initial schema state is empty
- schema is loaded dynamically based on user input
- the linting refresh will be handled automatically, because it's built into our bundled `jsonSchema()` and `json5Schema()` modes

```ts
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { json5Schema } from "codemirror-json-schema/json5";

import { updateSchema } from "codemirror-json-schema";

const json5State = EditorState.create({
  doc: `{
    example: true,
    // json5 is awesome!
  }`,
  // note: you can still provide initial
  // schema when creating state
  extensions: [json5Schema()],
});

const editor = new EditorView({ state: json5State });

const schemaSelect = document.getElementById("schema-selection");

schemaSelect!.onchange = async (e) => {
  const val = e.target!.value!;
  if (!val) {
    return;
  }
  // parse the remote schema spec to json
  const data = await (
    await fetch(`https://json.schemastore.org/${val}`)
  ).json();
  // this will update the schema state field, in an editor specific way
  updateSchema(editor, data);
};
```

if you are using the "custom path" with this approach, you will need to configure linting refresh as well:

```ts
import { linter } from "@codemirror/lint";
import { json5SchemaLinter } from "codemirror-json-schema/json5";
import { handleRefresh } from "codemirror-json-schema";

const state = EditorState.create({
  // ...
  extensions: [
    linter(json5SchemaLinter(), {
      needsRefresh: handleRefresh,
    })
  ];
}
```

## Current Constraints:

- currently only tested with standard schemas using json4 spec. results may vary
- doesn't place cursor inside known insert text yet
- currently you can only override the texts and rendering of a hover. we plan to add the same for validation errors and autocomplete

## Inspiration

`monaco-json` and `monaco-yaml` both provide json schema features for json, cson and yaml, and we want the nascent codemirror 6 to have them as well!

Also, json5 is slowly growing in usage, and it needs full language support for the browser!

## Our Goals

- working GeoJSON spec linter & completion
- working variables json mode for `cm6-graphql`, ala `monaco-graphql`
- json5 support for `graphiql` as a plugin!
- perhaps use @lezer to make a json5 language service for monaco-editor + json5?
- json5 + json4 json schema features for all!
