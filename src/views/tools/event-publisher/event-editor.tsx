import { memo, useMemo } from "react";
import { useColorMode } from "@chakra-ui/react";
import ReactCodeMirror from "@uiw/react-codemirror";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { jsonSchema } from "codemirror-json-schema";
import { keymap } from "@codemirror/view";
import { useInterval } from "react-use";
import _throttle from "lodash.throttle";
import { jsonLanguage } from "@codemirror/lang-json";

import { NostrEventSchema } from "./schema";
import { useUserSearchDirectoryContext } from "../../../providers/global/user-directory-provider";
import { updateCodeMirrorUserAutocomplete, codeMirrorUserAutocomplete } from "../event-console/user-autocomplete";

const EventEditor = memo(
  ({ value, onChange, onRun }: { value: string; onChange: (v: string) => void; onRun?: () => void }) => {
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
              if (onRun) onRun();
              return true;
            },
            shift: () => {
              if (onRun) onRun();
              return true;
            },
          },
        ]),
        jsonSchema(NostrEventSchema),
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

export default EventEditor;
