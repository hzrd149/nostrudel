import { ToastPosition } from './toast.placement.js';
import { T as ToastMethods } from './toast.provider-ab09bc2e.js';
import { T as ToastState, a as ToastId } from './toast.types-24f022fd.js';
import 'react/jsx-runtime';
import 'react';
import 'framer-motion';
import '@chakra-ui/portal';
import '@chakra-ui/system';
import '@chakra-ui/alert';

type ToastStore = ToastMethods & {
    getState: () => ToastState;
    subscribe: (onStoreChange: () => void) => () => void;
    removeToast: (id: ToastId, position: ToastPosition) => void;
};
/**
 * Store to track all the toast across all positions
 */
declare const toastStore: ToastStore;

export { toastStore };
