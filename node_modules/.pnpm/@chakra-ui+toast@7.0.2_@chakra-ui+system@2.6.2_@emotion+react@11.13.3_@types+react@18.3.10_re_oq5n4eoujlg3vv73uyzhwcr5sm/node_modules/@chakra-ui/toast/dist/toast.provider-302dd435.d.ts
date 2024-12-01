import * as react_jsx_runtime from 'react/jsx-runtime';
import * as react from 'react';
import { Variants } from 'framer-motion';
import { PortalProps } from '@chakra-ui/portal';
import { b as ToastOptions, c as ToastMessage, a as ToastId, C as CloseAllToastsOptions, U as UseToastOptions } from './toast.types-84753540.js';

interface ToastComponentProps extends ToastOptions, Pick<ToastProviderProps, "motionVariants" | "toastSpacing"> {
}
declare const ToastComponent: react.MemoExoticComponent<(props: ToastComponentProps) => react_jsx_runtime.JSX.Element>;

interface ToastMethods {
    /**
     * Function to actually create a toast and add it
     * to state at the specified position
     */
    notify: (message: ToastMessage, options?: CreateToastOptions) => ToastId;
    /**
     * Close all toasts at once.
     * If given positions, will only close those.
     */
    closeAll: (options?: CloseAllToastsOptions) => void;
    /**
     * Requests to close a toast based on its id and position
     */
    close: (id: ToastId) => void;
    /**
     * Update a specific toast with new options based on the
     * passed `id`
     */
    update: (id: ToastId, options: Omit<UseToastOptions, "id">) => void;
    isActive: (id: ToastId) => boolean;
}
type CreateToastOptions = Partial<Pick<ToastOptions, "status" | "duration" | "position" | "id" | "onCloseComplete" | "containerStyle">>;
type ToastProviderProps = React.PropsWithChildren<{
    /**
     * Default options for `useToast(options)`
     *
     * @example
     * <ToastProvider defaultOptions={{ duration: 10_000, isClosable: true }} />
     */
    defaultOptions?: UseToastOptions;
    /**
     * Customize the default motion config to animate the toasts your way
     *
     * @example
     * const motionVariants =
     * <ToastProvider motionVariants={motionVariants} />
     */
    motionVariants?: Variants;
    /**
     * Are you looking for a way to style the toast? Use a custom `Alert` variant in the theme.
     * This property overrides the default ToastComponent with your own implementation.
     *
     * @example
     * const CustomToastComponent = (props: ToastComponentProps) => ...
     * <ToastProvider component={CustomToastComponent} />
     *
     * @default ToastComponent
     */
    component?: React.FC<ToastComponentProps>;
    /**
     * Define the margin between toasts
     *
     * @default 0.5rem
     */
    toastSpacing?: string | number;
    /**
     * Props to be forwarded to the portal component
     */
    portalProps?: Pick<PortalProps, "appendToParentPortal" | "containerRef">;
}>;
/**
 * Passes default options down to be used by toast creator function
 */
declare const ToastOptionProvider: react.Provider<UseToastOptions | undefined>;
declare const useToastOptionContext: () => UseToastOptions | undefined;
/**
 * Manages the creation, and removal of toasts
 * across all corners ("top", "bottom", etc.)
 */
declare const ToastProvider: (props: ToastProviderProps) => react_jsx_runtime.JSX.Element;

export { CreateToastOptions as C, ToastMethods as T, ToastProviderProps as a, ToastProvider as b, ToastOptionProvider as c, ToastComponentProps as d, ToastComponent as e, useToastOptionContext as u };
