import { memo, useMemo } from "react";
import { useColorMode } from "@chakra-ui/react";
import ReactCodeMirror from "@uiw/react-codemirror";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { jsonSchema } from "codemirror-json-schema";
import { keymap } from "@codemirror/view";
import { useInterval } from "react-use";
import _throttle from "lodash.throttle";
import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { jsonLanguage } from "@codemirror/lang-json";
import { syntaxTree } from "@codemirror/language";

import { NostrFilterSchema } from "./schema";
import { UserDirectory, useUserSearchDirectoryContext } from "../../../providers/global/user-directory-provider";
import { codeMirrorUserAutocomplete, updateCodeMirrorUserAutocomplete } from "./user-autocomplete";

const FilterEditor = memo(
  ({ value, onChange, onRun }: { value: string; onChange: (v: string) => void; onRun: () => void }) => {
    const getDirectory = useUserSearchDirectoryContext();
    const { colorMode } = useColorMode();

    useInterval(() => {
      updateCodeMirrorUserAutocomplete(getDirectory());
    }, 1000);

    const extensions = useMemo(
      () => [
        keymap.of([
          {
            win: "Ctrl-Enter",
            linux: "Ctrl-Enter",
            mac: "Cmd-Enter",
            preventDefault: true,
            run: () => {
              onRun();
              return true;
            },
            shift: () => {
              onRun();
              return true;
            },
          },
        ]),
        jsonSchema(NostrFilterSchema),
        jsonLanguage.data.of({
          autocomplete: codeMirrorUserAutocomplete,
        }),
      ],
      [onRun],
    );
    return (
      <ReactCodeMirror
        value={value}
        onChange={onChange}
        height="200px"
        lang="json"
        extensions={extensions}
        theme={colorMode === "light" ? githubLight : githubDark}
      />
    );
  },
);

export default FilterEditor;
