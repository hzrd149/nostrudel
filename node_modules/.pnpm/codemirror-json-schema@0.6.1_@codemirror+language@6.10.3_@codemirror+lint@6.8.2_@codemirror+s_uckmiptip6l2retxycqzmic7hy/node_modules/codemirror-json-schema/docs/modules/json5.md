[codemirror-json-schema](../README.md) / json5

# Module: json5

## Table of contents

### Bundled Codemirror Extensions

- [json5Schema](json5.md#json5schema)

### Codemirror Extensions

- [json5Completion](json5.md#json5completion)
- [json5SchemaHover](json5.md#json5schemahover)
- [json5SchemaLinter](json5.md#json5schemalinter)

### Utilities

- [parseJSON5Document](json5.md#parsejson5document)
- [parseJSON5DocumentState](json5.md#parsejson5documentstate)

## Bundled Codemirror Extensions

### json5Schema

▸ **json5Schema**(`schema?`): `Extension`[]

Full featured cm6 extension for json5, including `codemirror-json5`

#### Parameters

| Name      | Type          |
| :-------- | :------------ |
| `schema?` | `JSONSchema7` |

#### Returns

`Extension`[]

#### Defined in

[json5-bundled.ts:16](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/json5-bundled.ts#L16)

## Codemirror Extensions

### json5Completion

▸ **json5Completion**(`opts?`): (`ctx`: `CompletionContext`) => `CompletionResult` \| `never`[]

provides a JSON schema enabled autocomplete extension for codemirror and json5

#### Parameters

| Name   | Type                                       |
| :----- | :----------------------------------------- |
| `opts` | `Omit`<`JSONCompletionOptions`, `"mode"`\> |

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

[json-completion.ts:819](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/json-completion.ts#L819)

---

### json5SchemaHover

▸ **json5SchemaHover**(`options?`): (`view`: `EditorView`, `pos`: `number`, `side`: `Side`) => `Promise`<`null` \| `Tooltip`\>

Instantiates a JSONHover instance with the JSON5 mode

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

[json5-hover.ts:13](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/json5-hover.ts#L13)

---

### json5SchemaLinter

▸ **json5SchemaLinter**(`options?`): (`view`: `EditorView`) => `Diagnostic`[]

Instantiates a JSONValidation instance with the JSON5 mode

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

[json5-validation.ts:12](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/json5-validation.ts#L12)

## Utilities

### parseJSON5Document

▸ **parseJSON5Document**(`jsonString`): `Object`

Mimics the behavior of `json-source-map`'s `parseJSONDocument` function, for json5!

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

[utils/parseJSON5Document.ts:28](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/utils/parseJSON5Document.ts#L28)

---

### parseJSON5DocumentState

▸ **parseJSON5DocumentState**(`state`): `Object`

Return parsed data and json5 pointers for a given codemirror EditorState

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

[utils/parseJSON5Document.ts:14](https://github.com/acao/codemirror-json-schema/blob/efd54f0/src/utils/parseJSON5Document.ts#L14)
