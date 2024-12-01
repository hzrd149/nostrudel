[codemirror-json-schema](../README.md) / index

# Module: index

## Table of contents

### Bundled Codemirror Extensions

- [jsonSchema](index.md#jsonschema)

### Codemirror Extensions

- [jsonCompletion](index.md#jsoncompletion)
- [jsonSchemaHover](index.md#jsonschemahover)
- [jsonSchemaLinter](index.md#jsonschemalinter)

### Utilities

- [getJsonPointers](index.md#getjsonpointers)
- [jsonPointerForPosition](index.md#jsonpointerforposition)
- [parseJSONDocument](index.md#parsejsondocument)
- [parseJSONDocumentState](index.md#parsejsondocumentstate)

### Functions

- [getJSONSchema](index.md#getjsonschema)
- [getJsonPointerAt](index.md#getjsonpointerat)
- [handleRefresh](index.md#handlerefresh)
- [stateExtensions](index.md#stateextensions)
- [updateSchema](index.md#updateschema)

### Type Aliases

- [CursorData](index.md#cursordata)
- [FoundCursorData](index.md#foundcursordata)
- [HoverOptions](index.md#hoveroptions)
- [JSONMode](index.md#jsonmode)
- [JSONPartialPointerData](index.md#jsonpartialpointerdata)
- [JSONPointerData](index.md#jsonpointerdata)
- [JSONPointersMap](index.md#jsonpointersmap)
- [JSONValidationOptions](index.md#jsonvalidationoptions)

### Variables

- [schemaStateField](index.md#schemastatefield)

## Bundled Codemirror Extensions

### jsonSchema

▸ **jsonSchema**(`schema?`): `Extension`[]

Full featured cm6 extension for json, including `@codemirror/lang-json`

#### Parameters

| Name      | Type          |
| :-------- | :------------ |
| `schema?` | `JSONSchema7` |

#### Returns

`Extension`[]

#### Defined in

[bundled.ts:15](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/bundled.ts#L15)

## Codemirror Extensions

### jsonCompletion

▸ **jsonCompletion**(`opts?`): (`ctx`: `CompletionContext`) => `CompletionResult` \| `never`[]

provides a JSON schema enabled autocomplete extension for codemirror

#### Parameters

| Name   | Type                    |
| :----- | :---------------------- |
| `opts` | `JSONCompletionOptions` |

#### Returns

`fn`

▸ (`ctx`): `CompletionResult` \| `never`[]

##### Parameters

| Name  | Type                |
| :---- | :------------------ |
| `ctx` | `CompletionContext` |

##### Returns

`CompletionResult` \| `never`[]

#### Defined in

[json-completion.ts:808](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/json-completion.ts#L808)

---

### jsonSchemaHover

▸ **jsonSchemaHover**(`options?`): (`view`: `EditorView`, `pos`: `number`, `side`: `Side`) => `Promise`<`null` \| `Tooltip`\>

provides a JSON schema enabled tooltip extension for codemirror

#### Parameters

| Name       | Type                                    |
| :--------- | :-------------------------------------- |
| `options?` | [`HoverOptions`](index.md#hoveroptions) |

#### Returns

`fn`

▸ (`view`, `pos`, `side`): `Promise`<`null` \| `Tooltip`\>

##### Parameters

| Name   | Type         |
| :----- | :----------- |
| `view` | `EditorView` |
| `pos`  | `number`     |
| `side` | `Side`       |

##### Returns

`Promise`<`null` \| `Tooltip`\>

#### Defined in

[json-hover.ts:42](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/json-hover.ts#L42)

---

### jsonSchemaLinter

▸ **jsonSchemaLinter**(`options?`): (`view`: `EditorView`) => `Diagnostic`[]

Helper for simpler class instantiaton

#### Parameters

| Name       | Type                                                      |
| :--------- | :-------------------------------------------------------- |
| `options?` | [`JSONValidationOptions`](index.md#jsonvalidationoptions) |

#### Returns

`fn`

▸ (`view`): `Diagnostic`[]

##### Parameters

| Name   | Type         |
| :----- | :----------- |
| `view` | `EditorView` |

##### Returns

`Diagnostic`[]

#### Defined in

[json-validation.ts:43](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/json-validation.ts#L43)

## Utilities

### getJsonPointers

▸ **getJsonPointers**(`state`, `mode?`): [`JSONPointersMap`](index.md#jsonpointersmap)

retrieve a Map of all the json pointers in a document

#### Parameters

| Name    | Type                            | Default value |
| :------ | :------------------------------ | :------------ |
| `state` | `EditorState`                   | `undefined`   |
| `mode`  | [`JSONMode`](index.md#jsonmode) | `"json4"`     |

#### Returns

[`JSONPointersMap`](index.md#jsonpointersmap)

#### Defined in

[utils/jsonPointers.ts:57](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/utils/jsonPointers.ts#L57)

---

### jsonPointerForPosition

▸ **jsonPointerForPosition**(`state`, `pos`, `side?`): `string`

retrieve a JSON pointer for a given position in the editor

#### Parameters

| Name    | Type          | Default value |
| :------ | :------------ | :------------ |
| `state` | `EditorState` | `undefined`   |
| `pos`   | `number`      | `undefined`   |
| `side`  | `Side`        | `-1`          |

#### Returns

`string`

#### Defined in

[utils/jsonPointers.ts:45](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/utils/jsonPointers.ts#L45)

---

### parseJSONDocument

▸ **parseJSONDocument**(`jsonString`): `Object`

Mimics the behavior of `json-source-map`'s `parseJSONDocument` function using codemirror EditorState

#### Parameters

| Name         | Type     |
| :----------- | :------- |
| `jsonString` | `string` |

#### Returns

`Object`

| Name       | Type                                          |
| :--------- | :-------------------------------------------- |
| `data`     | `any`                                         |
| `pointers` | [`JSONPointersMap`](index.md#jsonpointersmap) |

#### Defined in

[utils/parseJSONDocument.ts:23](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/utils/parseJSONDocument.ts#L23)

---

### parseJSONDocumentState

▸ **parseJSONDocumentState**(`state`): `Object`

Return parsed data and json pointers for a given codemirror EditorState

#### Parameters

| Name    | Type          |
| :------ | :------------ |
| `state` | `EditorState` |

#### Returns

`Object`

| Name       | Type                                          |
| :--------- | :-------------------------------------------- |
| `data`     | `any`                                         |
| `pointers` | [`JSONPointersMap`](index.md#jsonpointersmap) |

#### Defined in

[utils/parseJSONDocument.ts:9](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/utils/parseJSONDocument.ts#L9)

## Functions

### getJSONSchema

▸ **getJSONSchema**(`state`): `void` \| `JSONSchema7`

#### Parameters

| Name    | Type          |
| :------ | :------------ |
| `state` | `EditorState` |

#### Returns

`void` \| `JSONSchema7`

#### Defined in

[state.ts:25](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/state.ts#L25)

---

### getJsonPointerAt

▸ **getJsonPointerAt**(`docText`, `node`): `string`

#### Parameters

| Name      | Type         |
| :-------- | :----------- |
| `docText` | `Text`       |
| `node`    | `SyntaxNode` |

#### Returns

`string`

#### Defined in

[utils/jsonPointers.ts:12](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/utils/jsonPointers.ts#L12)

---

### handleRefresh

▸ **handleRefresh**(`vu`): `boolean`

#### Parameters

| Name | Type         |
| :--- | :----------- |
| `vu` | `ViewUpdate` |

#### Returns

`boolean`

#### Defined in

[json-validation.ts:33](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/json-validation.ts#L33)

---

### stateExtensions

▸ **stateExtensions**(`schema?`): `Extension`[]

#### Parameters

| Name      | Type          |
| :-------- | :------------ |
| `schema?` | `JSONSchema7` |

#### Returns

`Extension`[]

#### Defined in

[state.ts:29](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/state.ts#L29)

---

### updateSchema

▸ **updateSchema**(`view`, `schema?`): `void`

#### Parameters

| Name      | Type          |
| :-------- | :------------ |
| `view`    | `EditorView`  |
| `schema?` | `JSONSchema7` |

#### Returns

`void`

#### Defined in

[state.ts:19](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/state.ts#L19)

## Type Aliases

### CursorData

Ƭ **CursorData**: `Object`

#### Type declaration

| Name      | Type         |
| :-------- | :----------- |
| `pointer` | `string`     |
| `schema?` | `JsonSchema` |

#### Defined in

[json-hover.ts:16](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/json-hover.ts#L16)

---

### FoundCursorData

Ƭ **FoundCursorData**: `Required`<[`CursorData`](index.md#cursordata)\>

#### Defined in

[json-hover.ts:18](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/json-hover.ts#L18)

---

### HoverOptions

Ƭ **HoverOptions**: `Object`

#### Type declaration

| Name             | Type                                                                    |
| :--------------- | :---------------------------------------------------------------------- |
| `formatHover?`   | (`data`: `HoverTexts`) => `HTMLElement`                                 |
| `getHoverTexts?` | (`data`: [`FoundCursorData`](index.md#foundcursordata)) => `HoverTexts` |
| `parser?`        | (`text`: `string`) => `any`                                             |

#### Defined in

[json-hover.ts:22](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/json-hover.ts#L22)

---

### JSONMode

Ƭ **JSONMode**: `"json4"` \| `"json5"`

#### Defined in

[utils/jsonPointers.ts:8](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/utils/jsonPointers.ts#L8)

---

### JSONPartialPointerData

Ƭ **JSONPartialPointerData**: `Object`

#### Type declaration

| Name      | Type     |
| :-------- | :------- |
| `keyFrom` | `number` |
| `keyTo`   | `number` |

#### Defined in

[types.ts:4](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/types.ts#L4)

---

### JSONPointerData

Ƭ **JSONPointerData**: `Object`

#### Type declaration

| Name        | Type     |
| :---------- | :------- |
| `keyFrom`   | `number` |
| `keyTo`     | `number` |
| `valueFrom` | `number` |
| `valueTo`   | `number` |

#### Defined in

[types.ts:9](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/types.ts#L9)

---

### JSONPointersMap

Ƭ **JSONPointersMap**: `Map`<`string`, [`JSONPointerData`](index.md#jsonpointerdata) \| [`JSONPartialPointerData`](index.md#jsonpartialpointerdata)\>

#### Defined in

[types.ts:18](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/types.ts#L18)

---

### JSONValidationOptions

Ƭ **JSONValidationOptions**: `Object`

#### Type declaration

| Name           | Type                                                               |
| :------------- | :----------------------------------------------------------------- |
| `formatError?` | (`error`: `JsonError`) => `string`                                 |
| `jsonParser?`  | typeof [`parseJSONDocumentState`](index.md#parsejsondocumentstate) |

#### Defined in

[json-validation.ts:26](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/json-validation.ts#L26)

## Variables

### schemaStateField

• `Const` **schemaStateField**: `StateField`<`void` \| `JSONSchema7`\>

#### Defined in

[state.ts:6](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/state.ts#L6)
