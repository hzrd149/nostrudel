import { ToastPosition } from './toast.placement.mjs';
import { T as ToastMethods } from './toast.provider-302dd435.js';
import { T as ToastState, a as ToastId } from './toast.types-84753540.js';
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
