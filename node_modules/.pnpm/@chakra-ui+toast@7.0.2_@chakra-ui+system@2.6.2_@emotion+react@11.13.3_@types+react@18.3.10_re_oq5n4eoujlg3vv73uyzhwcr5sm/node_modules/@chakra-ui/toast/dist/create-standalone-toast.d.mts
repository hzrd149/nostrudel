import { U as UseToastOptions, d as CreateToastFnReturn } from './toast.types-84753540.js';
import { a as ToastProviderProps } from './toast.provider-302dd435.js';
import './toast.placement.mjs';
import { useChakra, ColorMode } from '@chakra-ui/system';
import '@chakra-ui/alert';
import 'react';
import 'react/jsx-runtime';
import 'framer-motion';
import '@chakra-ui/portal';

interface CreateStandAloneToastParam extends Partial<ReturnType<typeof useChakra> & {
    setColorMode: (value: ColorMode) => void;
    defaultOptions: UseToastOptions;
}>, Omit<ToastProviderProps, "children"> {
}
declare const defaultStandaloneParam: CreateStandAloneToastParam & Required<Omit<CreateStandAloneToastParam, keyof ToastProviderProps>>;
type CreateStandaloneToastReturn = {
    ToastContainer: () => JSX.Element;
    toast: CreateToastFnReturn;
};
/**
 * Create a toast
 */
declare function createStandaloneToast({ theme, colorMode, toggleColorMode, setColorMode, defaultOptions, motionVariants, toastSpacing, component, forced, }?: CreateStandAloneToastParam): CreateStandaloneToastReturn;

export { CreateStandAloneToastParam, CreateStandaloneToastReturn, createStandaloneToast, defaultStandaloneParam };
