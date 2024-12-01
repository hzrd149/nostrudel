import * as _chakra_ui_system from '@chakra-ui/system';
import { HTMLChakraProps } from '@chakra-ui/system';
import { HTMLMotionProps } from 'framer-motion';
import { PopoverTransitionProps } from './popover-transition.mjs';
import 'react';

interface PopoverContentProps extends PopoverTransitionProps {
    rootProps?: HTMLChakraProps<"div">;
    motionProps?: HTMLMotionProps<"section">;
}
declare const PopoverContent: _chakra_ui_system.ComponentWithAs<"section", PopoverContentProps>;

export { PopoverContent, PopoverContentProps };
