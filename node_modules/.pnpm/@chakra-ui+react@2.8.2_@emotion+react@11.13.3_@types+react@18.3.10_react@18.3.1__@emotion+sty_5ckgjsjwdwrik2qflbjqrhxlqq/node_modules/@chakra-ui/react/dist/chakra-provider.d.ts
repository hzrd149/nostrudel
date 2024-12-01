import '@chakra-ui/accordion';
import '@chakra-ui/alert';
import '@chakra-ui/avatar';
import '@chakra-ui/breadcrumb';
import '@chakra-ui/button';
import '@chakra-ui/card';
import '@chakra-ui/checkbox';
import '@chakra-ui/close-button';
import '@chakra-ui/control-box';
import '@chakra-ui/counter';
import '@chakra-ui/css-reset';
import '@chakra-ui/editable';
import '@chakra-ui/focus-lock';
import '@chakra-ui/form-control';
import '@chakra-ui/hooks';
import '@chakra-ui/icon';
import '@chakra-ui/image';
import '@chakra-ui/input';
import '@chakra-ui/layout';
import '@chakra-ui/media-query';
import '@chakra-ui/menu';
import '@chakra-ui/modal';
import '@chakra-ui/number-input';
import '@chakra-ui/pin-input';
import '@chakra-ui/popover';
import '@chakra-ui/popper';
import '@chakra-ui/portal';
import '@chakra-ui/progress';
import '@chakra-ui/radio';
import '@chakra-ui/react-env';
import '@chakra-ui/select';
import '@chakra-ui/skeleton';
import '@chakra-ui/skip-nav';
import '@chakra-ui/slider';
import '@chakra-ui/spinner';
import '@chakra-ui/stat';
import '@chakra-ui/stepper';
import '@chakra-ui/switch';
import '@chakra-ui/system';
import '@chakra-ui/table';
import '@chakra-ui/tabs';
import '@chakra-ui/tag';
import '@chakra-ui/textarea';
import '@chakra-ui/theme';
import '@chakra-ui/theme-utils';
import { ToastProviderProps } from '@chakra-ui/toast';
import '@chakra-ui/tooltip';
import '@chakra-ui/transition';
import '@chakra-ui/visually-hidden';
import * as react_jsx_runtime from 'react/jsx-runtime';
import { ChakraProviderProps as ChakraProviderProps$1 } from '@chakra-ui/provider';

interface ChakraProviderProps extends ChakraProviderProps$1 {
    /**
     * Provide defaults for `useToast()` usages for `ChakraProvider`s children
     */
    toastOptions?: ToastProviderProps;
}
declare const ChakraProvider: ({ children, theme, toastOptions, ...restProps }: ChakraProviderProps) => react_jsx_runtime.JSX.Element;
declare const ChakraBaseProvider: ({ children, theme, toastOptions, ...restProps }: ChakraProviderProps) => react_jsx_runtime.JSX.Element;

export { ChakraBaseProvider, ChakraProvider, ChakraProviderProps };
