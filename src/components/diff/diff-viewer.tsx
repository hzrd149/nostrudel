import { ColorModeContext, useColorMode } from "@chakra-ui/react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import computeStyles, { ReactDiffViewerStylesOverride } from "react-diff-viewer-continued/lib/src/styles";

const fixedStyles: ReactDiffViewerStylesOverride = {
  codeFold: {
    height: "auto",
  },
  contentText: {
    lineHeight: "initial !important",
    fontFamily: "inherit",
  },
};

// NOTE: This is a hack to hard code the emotion styles for react-diff-viewer-continued
// because the component was creating a new stylesheet for every instance (I guess the developer has no idea how to use @emotion/css)
let computed: ReturnType<typeof computeStyles>;
function getComputedStyles(dark = false) {
  if (!computed) computed = computeStyles(fixedStyles, dark, "code-better");
  return computed;
}

class FixedReactDiffViewer extends ReactDiffViewer {
  static contextType = ColorModeContext;

  // @ts-expect-error
  constructor(...args) {
    // @ts-expect-error
    super(...args);
    // @ts-expect-error
    this.computeStyles = () => {
      // @ts-expect-error
      return getComputedStyles(this.context.colorMode === "dark");
    };
  }
}

export default function DiffViewer({
  oldValue,
  newValue,
  method = DiffMethod.WORDS,
  splitView = false,
}: {
  oldValue: string;
  newValue: string;
  method?: DiffMethod;
  splitView?: boolean;
}) {
  const { colorMode } = useColorMode();

  return (
    <FixedReactDiffViewer
      oldValue={oldValue}
      newValue={newValue}
      useDarkTheme={colorMode === "dark"}
      hideLineNumbers
      splitView={splitView}
      compareMethod={method}
    />
  );
}
