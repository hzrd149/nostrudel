import * as react_jsx_runtime from 'react/jsx-runtime';
import { HTMLChakraProps, SystemProps } from '@chakra-ui/system';

interface PopoverArrowProps extends HTMLChakraProps<"div"> {
    /**
     * The color of the arrow's shadow
     */
    shadowColor?: SystemProps["color"];
}
declare function PopoverArrow(props: PopoverArrowProps): react_jsx_runtime.JSX.Element;
declare namespace PopoverArrow {
    var displayName: string;
}

export { PopoverArrow, PopoverArrowProps };
