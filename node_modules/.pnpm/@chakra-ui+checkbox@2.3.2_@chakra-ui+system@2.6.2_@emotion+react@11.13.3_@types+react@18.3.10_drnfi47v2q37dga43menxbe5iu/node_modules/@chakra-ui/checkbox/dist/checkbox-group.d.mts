import * as react_jsx_runtime from 'react/jsx-runtime';
import { ThemingProps } from '@chakra-ui/system';
import { U as UseCheckboxGroupProps } from './checkbox-types-17f713ed.js';
import 'react';

interface CheckboxGroupProps extends UseCheckboxGroupProps, Omit<ThemingProps<"Checkbox">, "orientation"> {
    children?: React.ReactNode;
}
/**
 * Used for multiple checkboxes which are bound in one group,
 * and it indicates whether one or more options are selected.
 *
 * @see Docs https://chakra-ui.com/checkbox
 */
declare function CheckboxGroup(props: CheckboxGroupProps): react_jsx_runtime.JSX.Element;
declare namespace CheckboxGroup {
    var displayName: string;
}

export { CheckboxGroup, CheckboxGroupProps };
