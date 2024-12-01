import { Control, FieldValues, FormState, InternalFieldName, ReadFormState } from '../types';
declare const _default: <T extends FieldValues, K extends ReadFormState>(formStateData: Partial<FormState<T>> & {
    name?: InternalFieldName;
}, _proxyFormState: K, updateFormState: Control<T>["_updateFormState"], isRoot?: boolean) => string | true | undefined;
export default _default;
//# sourceMappingURL=shouldRenderFormState.d.ts.map