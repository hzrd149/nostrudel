import { Button, Flex, Select } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Mosaic, MosaicNode, MosaicWindow } from "react-mosaic-component";
import "react-mosaic-component/react-mosaic-component.css";
import "./styles.css";

import { useActiveAccount } from "applesauce-react/hooks";
import { ChevronLeftIcon } from "../../../components/icons";
import RequireActiveAccount from "../../../components/router/require-active-account";
import { getEventCoordinate } from "../../../helpers/nostr/event";
import { getStreamStatus, getStreamTitle } from "../../../helpers/nostr/stream";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import ChatCard from "./chat-card";
import UsersCard from "./users-card";
import VideoCard from "./video-card";
import ZapsCard from "./zaps-card";

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

function StreamModerationDashboard({ stream }: { stream: NostrEvent }) {
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
  const account = useActiveAccount()!;
  const readRelays = useReadRelays();

  const { timeline: streams } = useTimelineLoader(account.pubkey + "-streams", readRelays, [
    {
      authors: [account.pubkey],
      kinds: [kinds.LiveEvent],
    },
    { "#p": [account.pubkey], kinds: [kinds.LiveEvent] },
  ]);

  const [selected, setSelected] = useState<NostrEvent>();

  return (
    <Flex direction="column" w="full" h="full">
      <Flex gap="2" p="2" pb="0">
        <Button onClick={() => navigate(-1)} leftIcon={<ChevronLeftIcon />}>
          Back
        </Button>
        <Select
          placeholder="Select stream"
          value={selected && getEventCoordinate(selected)}
          onChange={(e) => setSelected(streams.find((s) => getEventCoordinate(s) === e.target.value))}
          w="lg"
        >
          {streams.map((stream) => (
            <option key={getEventUID(stream)} value={getEventCoordinate(stream)}>
              {getStreamTitle(stream)} ({getStreamStatus(stream)})
            </option>
          ))}
        </Select>
      </Flex>
      {selected && <StreamModerationDashboard stream={selected} />}
    </Flex>
  );
}

export default function StreamModerationView() {
  return (
    <RequireActiveAccount>
      <StreamModerationPage />
    </RequireActiveAccount>
  );
}
