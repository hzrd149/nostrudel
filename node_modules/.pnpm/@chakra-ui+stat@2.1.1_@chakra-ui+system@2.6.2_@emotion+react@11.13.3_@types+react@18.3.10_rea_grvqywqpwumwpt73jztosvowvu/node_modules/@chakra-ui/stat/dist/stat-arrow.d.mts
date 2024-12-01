import * as react_jsx_runtime from 'react/jsx-runtime';
import { IconProps } from '@chakra-ui/icon';

declare const StatDownArrow: React.FC<IconProps>;
declare function StatUpArrow(props: IconProps): react_jsx_runtime.JSX.Element;
declare namespace StatUpArrow {
    var displayName: string;
}
interface StatArrowProps extends IconProps {
    type?: "increase" | "decrease";
}
declare function StatArrow(props: StatArrowProps): react_jsx_runtime.JSX.Element;
declare namespace StatArrow {
    var displayName: string;
}

export { StatArrow, StatArrowProps, StatDownArrow, StatUpArrow };
