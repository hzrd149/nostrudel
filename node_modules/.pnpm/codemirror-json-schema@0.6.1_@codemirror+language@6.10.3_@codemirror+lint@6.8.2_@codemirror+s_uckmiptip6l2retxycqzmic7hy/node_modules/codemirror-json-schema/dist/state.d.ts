import { type EditorState, StateField } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type { JSONSchema7 } from "json-schema";
export declare const schemaStateField: StateField<void | JSONSchema7>;
export declare const updateSchema: (view: EditorView, schema?: JSONSchema7) => void;
export declare const getJSONSchema: (state: EditorState) => void | JSONSchema7;
export declare const stateExtensions: (schema?: JSONSchema7) => import("@codemirror/state").Extension[];
