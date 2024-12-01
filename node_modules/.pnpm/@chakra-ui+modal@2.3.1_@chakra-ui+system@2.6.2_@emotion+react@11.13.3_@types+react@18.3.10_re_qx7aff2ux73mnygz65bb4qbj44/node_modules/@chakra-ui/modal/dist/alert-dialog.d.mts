import * as _chakra_ui_system from '@chakra-ui/system';
import * as react_jsx_runtime from 'react/jsx-runtime';
import { ModalProps } from './modal.mjs';
import { ModalContentProps } from './modal-content.mjs';
export { ModalBody as AlertDialogBody } from './modal-body.mjs';
export { ModalCloseButton as AlertDialogCloseButton } from './modal-close-button.mjs';
export { ModalFooter as AlertDialogFooter } from './modal-footer.mjs';
export { ModalHeader as AlertDialogHeader } from './modal-header.mjs';
export { ModalOverlay as AlertDialogOverlay } from './modal-overlay.mjs';
import 'react';
import '@chakra-ui/focus-lock';
import '@chakra-ui/portal';
import './use-modal.mjs';
import '@chakra-ui/react-types';
import 'framer-motion';
import '@chakra-ui/close-button';

interface AlertDialogProps extends Omit<ModalProps, "initialFocusRef"> {
    leastDestructiveRef: NonNullable<ModalProps["initialFocusRef"]>;
}
/**
 * `AlertDialog` component is used interrupt the user with a mandatory confirmation or action.
 *
 * @see Docs https://chakra-ui.com/docs/components/alert-dialog
 * @see WAI-ARIA https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
 */
declare function AlertDialog(props: AlertDialogProps): react_jsx_runtime.JSX.Element;
declare const AlertDialogContent: _chakra_ui_system.ComponentWithAs<"section", ModalContentProps>;

export { AlertDialog, AlertDialogContent, AlertDialogProps };
