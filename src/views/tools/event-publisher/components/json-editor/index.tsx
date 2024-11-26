import { memo, useEffect, useMemo, useState } from "react";
import { Text, useColorMode } from "@chakra-ui/react";
import ReactCodeMirror from "@uiw/react-codemirror";
import { EventTemplate } from "nostr-tools";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { jsonSchema } from "codemirror-json-schema";
import { keymap } from "@codemirror/view";
import _throttle from "lodash.throttle";
import { jsonLanguage } from "@codemirror/lang-json";

import { NostrEventSchema } from "./schema";
import { codeMirrorUserAutocomplete } from "../../../event-console/user-autocomplete";
import { LooseEventTemplate } from "../../process";

const EventJsonEditor = memo(
  ({
    draft,
    onChange,
    onRun,
  }: {
    draft?: LooseEventTemplate;
    onChange: (v: EventTemplate) => void;
    onRun?: () => void;
  }) => {
    const { colorMode } = useColorMode();

    const [value, setValue] = useState(JSON.stringify(draft, null, 2));
    const [error, setError] = useState<Error>();
    const handleChange = (v: string) => {
      try {
        setError(undefined);
        setValue(v);

        const json = JSON.parse(v);
        if (json.content === undefined) throw new Error("Missing content");
        if (json.created_at === undefined) throw new Error("Missing created_at");
        if (json.kind === undefined) throw new Error("Missing kind");
        if (!Array.isArray(json.tags)) throw new Error("Missing tags");

        onChange(json);
      } catch (error) {
        if (error instanceof Error) setError(error);
      }
    };

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
      <>
        <ReactCodeMirror
          value={value}
          onChange={handleChange}
          height="100%"
          lang="json"
          extensions={extensions}
          theme={colorMode === "light" ? githubLight : githubDark}
        />
        {error && (
          <Text fontSize="sm" color="red.500">
            {error.message}
          </Text>
        )}
      </>
    );
  },
);

export default EventJsonEditor;
