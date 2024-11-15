import { ReactNode } from "react";
import { Button, ComponentWithAs, Flex, Heading, IconButton, IconProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import Translate01 from "../../../../components/icons/translate-01";
import Recording02 from "../../../../components/icons/recording-02";
import PenTool01 from "../../../../components/icons/pen-tool-01";
import { NoteTranslationsPage } from "../../../tools/transform-note/translation";
import useRouteSearchValue from "../../../../hooks/use-route-search-value";
import NoteTextToSpeechPage from "../../../tools/transform-note/text-to-speech";
import EventSummarizePage from "./tools/summary";

const tools: {
  icon: ComponentWithAs<"svg", IconProps>;
  id: string;
  name: string;
  render: (event: NostrEvent) => ReactNode;
}[] = [
  { id: "translate", icon: Translate01, name: "Translate", render: (event) => <NoteTranslationsPage note={event} /> },
  { id: "tts", icon: Recording02, name: "Text to speech", render: (event) => <NoteTextToSpeechPage note={event} /> },
  { id: "summarize", icon: PenTool01, name: "Summarize", render: (event) => <EventSummarizePage event={event} /> },
];

export default function ToolsTab({ event }: { event: NostrEvent }) {
  const selected = useRouteSearchValue("tool", "");
  const tool = tools.find((t) => t.id === selected.value);

  const IconComponent = tool?.icon;

  return (
    <Flex direction="column" gap="2" p="2" w="full">
      <Flex gap="2" alignItems="center" wrap="wrap">
        {tool && IconComponent ? (
          <IconButton
            icon={<IconComponent boxSize={6} />}
            aria-label="Select Tool"
            onClick={() => selected.clearValue(true)}
          />
        ) : (
          <>
            {tools.map(({ icon: Icon, name, id }) => (
              <Button
                variant="outline"
                key={id}
                leftIcon={<Icon boxSize={10} mb="4" />}
                onClick={() => selected.setValue(id, true)}
                h="36"
                w="36"
                flexDirection="column"
              >
                {name}
              </Button>
            ))}
          </>
        )}
        {tool && <Heading size="md">{tool.name}</Heading>}
      </Flex>
      {tool?.render(event)}
    </Flex>
  );
}
