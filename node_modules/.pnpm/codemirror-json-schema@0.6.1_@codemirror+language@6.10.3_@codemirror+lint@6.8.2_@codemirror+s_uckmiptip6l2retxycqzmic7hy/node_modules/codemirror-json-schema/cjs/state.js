"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateExtensions = exports.getJSONSchema = exports.updateSchema = exports.schemaStateField = void 0;
const state_1 = require("@codemirror/state");
const schemaEffect = state_1.StateEffect.define();
exports.schemaStateField = state_1.StateField.define({
    create() { },
    update(schema, tr) {
        for (const e of tr.effects) {
            if (e.is(schemaEffect)) {
                return e.value;
            }
        }
        return schema;
    },
});
const updateSchema = (view, schema) => {
    view.dispatch({
        effects: schemaEffect.of(schema),
    });
};
exports.updateSchema = updateSchema;
const getJSONSchema = (state) => {
    return state.field(exports.schemaStateField);
};
exports.getJSONSchema = getJSONSchema;
const stateExtensions = (schema) => [
    exports.schemaStateField.init(() => schema),
];
exports.stateExtensions = stateExtensions;
