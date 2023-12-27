import { useState } from "react";
import { Button, Flex, Select } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import { Mosaic, MosaicNode, MosaicWindow } from "react-mosaic-component";
import "./styles.css";
import "react-mosaic-component/react-mosaic-component.css";

import useParsedStreams from "../../../hooks/use-parsed-streams";
import useSubject from "../../../hooks/use-subject";
import { ParsedStream, STREAM_KIND, getATag } from "../../../helpers/nostr/stream";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import RequireCurrentAccount from "../../../providers/require-current-account";
import useCurrentAccount from "../../../hooks/use-current-account";
import { getEventUID } from "../../../helpers/nostr/events";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import { ChevronLeftIcon } from "../../../components/icons";
import RelaySelectionProvider from "../../../providers/relay-selection-provider";
import UsersCard from "./users-card";
import ZapsCard from "./zaps-card";
import ChatCard from "./chat-card";
import VideoCard from "./video-card";

const defaultLayout: MosaicNode<string> = {
  direction: "row",
  first: {
    direction: "column",
    first: "video",
    second: "users",
    splitPercentage: 40,
  },
  second: {
    direction: "row",
    first: "zaps",
    second: "chat",
  },
  splitPercentage: 33,
};

function StreamModerationDashboard({ stream }: { stream: ParsedStream }) {
  const [value, setValue] = useState<MosaicNode<string> | null>(defaultLayout);

  const ELEMENT_MAP: Record<string, JSX.Element> = {
    video: <VideoCard stream={stream} />,
    chat: <ChatCard stream={stream} />,
    users: <UsersCard stream={stream} />,
    zaps: <ZapsCard stream={stream} />,
  };
  const TITLE_MAP: Record<string, string> = {
    video: "Stream",
    chat: "Stream Chat",
    users: "Users in chat",
    zaps: "Zaps",
  };

  return (
    <Mosaic<string>
      className="chakra-theme"
      renderTile={(id, path) => (
        <MosaicWindow<string> path={path} title={TITLE_MAP[id]}>
          {ELEMENT_MAP[id]}
        </MosaicWindow>
      )}
      value={value}
      onChange={(v) => setValue(v)}
    />
  );
}

function StreamModerationPage() {
  const navigate = useNavigate();
  const account = useCurrentAccount()!;
  const readRelays = useReadRelayUrls();

  const timeline = useTimelineLoader(account.pubkey + "-streams", readRelays, [
    {
      authors: [account.pubkey],
      kinds: [STREAM_KIND],
    },
    { "#p": [account.pubkey], kinds: [STREAM_KIND] },
  ]);

  const streamEvents = useSubject(timeline.timeline);
  const streams = useParsedStreams(streamEvents);

  const [selected, setSelected] = useState<ParsedStream>();

  return (
    <Flex direction="column" w="full" h="full">
      <Flex gap="2" p="2" pb="0">
        <Button onClick={() => navigate(-1)} leftIcon={<ChevronLeftIcon />}>
          Back
        </Button>
        <Select
          placeholder="Select stream"
          value={selected && getATag(selected)}
          onChange={(e) => setSelected(streams.find((s) => getATag(s) === e.target.value))}
          w="lg"
        >
          {streams.map((stream) => (
            <option key={getEventUID(stream.event)} value={getATag(stream)}>
              {stream.title} ({stream.status})
            </option>
          ))}
        </Select>
      </Flex>
      {selected && (
        <RelaySelectionProvider additionalDefaults={selected.relays ?? []}>
          <StreamModerationDashboard stream={selected} />
        </RelaySelectionProvider>
      )}
    </Flex>
  );
}

export default function StreamModerationView() {
  return (
    <RequireCurrentAccount>
      <StreamModerationPage />
    </RequireCurrentAccount>
  );
}
