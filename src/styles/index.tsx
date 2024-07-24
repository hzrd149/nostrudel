import { Global } from "@emotion/react";

import { overrideReactTextareaAutocompleteStyles } from "./react-textarea-autocomplete";
import { capacitorScannerStyles } from "./capacitor-scanner";

export default function GlobalStyles() {
  return (
    <>
      <Global styles={overrideReactTextareaAutocompleteStyles} />
      <Global styles={capacitorScannerStyles} />
    </>
  );
}
