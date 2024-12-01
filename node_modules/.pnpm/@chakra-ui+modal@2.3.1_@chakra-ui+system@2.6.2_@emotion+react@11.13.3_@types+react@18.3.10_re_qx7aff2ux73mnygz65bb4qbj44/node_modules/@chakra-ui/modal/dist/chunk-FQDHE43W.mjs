'use client'
import {
  ModalContent
} from "./chunk-EL2VKIZQ.mjs";
import {
  Modal
} from "./chunk-MSA2NPQT.mjs";

// src/alert-dialog.tsx
import { forwardRef } from "@chakra-ui/system";
import { jsx } from "react/jsx-runtime";
function AlertDialog(props) {
  const { leastDestructiveRef, ...rest } = props;
  return /* @__PURE__ */ jsx(Modal, { ...rest, initialFocusRef: leastDestructiveRef });
}
var AlertDialogContent = forwardRef(
  (props, ref) => /* @__PURE__ */ jsx(ModalContent, { ref, role: "alertdialog", ...props })
);

export {
  AlertDialog,
  AlertDialogContent
};
//# sourceMappingURL=chunk-FQDHE43W.mjs.map