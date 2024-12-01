'use client'
import {
  ModalTransition
} from "./chunk-7NUJBCEL.mjs";
import {
  ModalFocusScope
} from "./chunk-NABYTFTG.mjs";
import {
  useModalContext,
  useModalStyles
} from "./chunk-MSA2NPQT.mjs";

// src/modal-content.tsx
import { cx } from "@chakra-ui/shared-utils";
import {
  chakra,
  forwardRef
} from "@chakra-ui/system";
import { jsx } from "react/jsx-runtime";
var ModalContent = forwardRef(
  (props, ref) => {
    const {
      className,
      children,
      containerProps: rootProps,
      motionProps,
      ...rest
    } = props;
    const { getDialogProps, getDialogContainerProps } = useModalContext();
    const dialogProps = getDialogProps(rest, ref);
    const containerProps = getDialogContainerProps(rootProps);
    const _className = cx("chakra-modal__content", className);
    const styles = useModalStyles();
    const dialogStyles = {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      width: "100%",
      outline: 0,
      ...styles.dialog
    };
    const dialogContainerStyles = {
      display: "flex",
      width: "100vw",
      height: "$100vh",
      position: "fixed",
      left: 0,
      top: 0,
      ...styles.dialogContainer
    };
    const { motionPreset } = useModalContext();
    return /* @__PURE__ */ jsx(ModalFocusScope, { children: /* @__PURE__ */ jsx(
      chakra.div,
      {
        ...containerProps,
        className: "chakra-modal__content-container",
        tabIndex: -1,
        __css: dialogContainerStyles,
        children: /* @__PURE__ */ jsx(
          ModalTransition,
          {
            preset: motionPreset,
            motionProps,
            className: _className,
            ...dialogProps,
            __css: dialogStyles,
            children
          }
        )
      }
    ) });
  }
);
ModalContent.displayName = "ModalContent";

export {
  ModalContent
};
//# sourceMappingURL=chunk-EL2VKIZQ.mjs.map