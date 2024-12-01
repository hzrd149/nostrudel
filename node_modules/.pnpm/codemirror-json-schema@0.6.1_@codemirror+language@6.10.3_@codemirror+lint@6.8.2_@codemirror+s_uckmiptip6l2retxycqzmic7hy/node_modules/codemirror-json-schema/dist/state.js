import { StateEffect, StateField } from "@codemirror/state";
const schemaEffect = StateEffect.define();
export const schemaStateField = StateField.define({
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
export const updateSchema = (view, schema) => {
    view.dispatch({
        effects: schemaEffect.of(schema),
    });
};
export const getJSONSchema = (state) => {
    return state.field(schemaStateField);
};
export const stateExtensions = (schema) => [
    schemaStateField.init(() => schema),
];
