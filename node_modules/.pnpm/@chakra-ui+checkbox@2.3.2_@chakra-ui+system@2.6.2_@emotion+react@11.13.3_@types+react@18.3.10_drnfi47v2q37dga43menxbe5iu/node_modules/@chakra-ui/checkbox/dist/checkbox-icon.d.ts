import * as react_jsx_runtime from 'react/jsx-runtime';
import { HTMLChakraProps } from '@chakra-ui/system';

interface CheckboxIconProps extends HTMLChakraProps<"svg"> {
    /**
     * @default false
     */
    isIndeterminate?: boolean;
    /**
     * @default false
     */
    isChecked?: boolean;
}
/**
 * CheckboxIcon is used to visually indicate the checked or indeterminate
 * state of a checkbox.
 *
 * @todo allow users pass their own icon svgs
 */
declare function CheckboxIcon(props: CheckboxIconProps): react_jsx_runtime.JSX.Element | null;

export { CheckboxIcon, CheckboxIconProps };
