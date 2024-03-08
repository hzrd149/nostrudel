import { useEffect, useMemo, useState } from "react";
import { Box, Button, Flex, Input, Text } from "@chakra-ui/react";
import AutoSizer from "react-virtualized-auto-sizer";
import ForceGraph, { LinkObject, NodeObject } from "react-force-graph-3d";
import { kinds } from "nostr-tools";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useDebounce, useObservable } from "react-use";
import {
  Group,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TextureLoader,
} from "three";

import useCurrentAccount from "../../hooks/use-current-account";
import RequireCurrentAccount from "../../providers/route/require-current-account";
import { useUsersMetadata } from "../../hooks/use-user-network";
import { getPubkeysFromList } from "../../helpers/nostr/lists";
import useUserContactList from "../../hooks/use-user-contact-list";
import useUserMetadata from "../../hooks/use-user-metadata";
import EventStore from "../../classes/event-store";
import NostrRequest from "../../classes/nostr-request";
import { isPTag } from "../../types/nostr-event";
import { ChevronLeftIcon } from "../../components/icons";
import { useReadRelays } from "../../hooks/use-client-relays";

type NodeType = { id: string; image?: string; name?: string };

function NetworkDMGraphPage() {
  const navigate = useNavigate();
  const account = useCurrentAccount()!;
  const relays = useReadRelays();

  const contacts = useUserContactList(account.pubkey);
  const contactsPubkeys = useMemo(
    () => (contacts ? getPubkeysFromList(contacts).map((p) => p.pubkey) : []),
    [contacts],
  );

  const [until, setUntil] = useState(dayjs().unix());
  const [since, setSince] = useState(dayjs().subtract(1, "week").unix());

  const store = useMemo(() => new EventStore(), []);
  const [fetchData] = useDebounce(
    () => {
      if (!contacts) return;

      store.clear();
      const request = new NostrRequest(relays);
      request.onEvent.subscribe((e) => store.addEvent(e));
      request.start({
        authors: contactsPubkeys,
        kinds: [kinds.EncryptedDirectMessage],
        since,
        until,
      });
    },
    2 * 1000,
    [relays, store, contactsPubkeys, since, until],
  );
  useEffect(() => {
    fetchData();
  }, [relays, store, contactsPubkeys, since, until]);

  const selfMetadata = useUserMetadata(account.pubkey);
  const usersMetadata = useUsersMetadata(contactsPubkeys);

  const newEventTrigger = useObservable(store.onEvent);
  const graphData = useMemo(() => {
    if (store.events.size === 0) return { nodes: [], links: [] };

    const nodes: Record<string, NodeObject<NodeType>> = {};
    const links: Record<string, LinkObject<NodeType>> = {};

    const getOrCreateNode = (pubkey: string) => {
      if (!nodes[pubkey]) {
        const node: NodeType = {
          id: pubkey,
        };

        const metadata = usersMetadata[pubkey];
        if (metadata) {
          node.image = metadata.picture;
          node.name = metadata.name;
        }

        nodes[pubkey] = node;
      }
      return nodes[pubkey];
    };

    for (const [_, dm] of store.events) {
      const author = dm.pubkey;
      const receiver = dm.tags.find(isPTag)?.[1];
      if (!receiver) continue;

      if (contactsPubkeys.includes(receiver) && (contactsPubkeys.includes(author) || author === account.pubkey)) {
        const keyA = [author, receiver].join("|");
        links[keyA] = { source: getOrCreateNode(author), target: getOrCreateNode(receiver) };
      }
    }

    return { nodes: Object.values(nodes), links: Object.values(links) };
  }, [contactsPubkeys, account.pubkey, usersMetadata, selfMetadata, newEventTrigger]);

  return (
    <Flex direction="column" gap="2" h="full" pt="2">
      <Flex gap="2" alignItems="center">
        <Button leftIcon={<ChevronLeftIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Input
          type="datetime-local"
          maxW="sm"
          value={dayjs.unix(since).format("YYYY-MM-DDThh:mm")}
          onChange={(e) => setSince(dayjs(e.target.value).unix())}
        />
        <Text>Showing all direct messages between contacts in the last {dayjs.unix(since).fromNow(true)}</Text>
      </Flex>
      <Box overflow="hidden" flex={1}>
        <AutoSizer>
          {({ height, width }) => (
            <ForceGraph<NodeType>
              graphData={graphData}
              enableNodeDrag={false}
              width={width}
              height={height}
              linkDirectionalArrowLength={3.5}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.25}
              nodeThreeObject={(node: NodeType) => {
                if (!node.image) {
                  return new Mesh(new SphereGeometry(5, 12, 6), new MeshBasicMaterial({ color: 0xaa0f0f }));
                }

                const group = new Group();

                const imgTexture = new TextureLoader().load(node.image);
                imgTexture.colorSpace = SRGBColorSpace;
                const material = new SpriteMaterial({ map: imgTexture });
                const sprite = new Sprite(material);
                sprite.scale.set(10, 10, 10);

                group.children.push(sprite);

                // if (node.name) {
                //   const text = new SpriteText(node.name, 8, "ffffff");
                //   text.position.set(0, 0, 16);
                //   group.children.push(text);
                // }

                return sprite;
              }}
            />
          )}
        </AutoSizer>
      </Box>
    </Flex>
  );
}

export default function NetworkDMGraphView() {
  return (
    <RequireCurrentAccount>
      <NetworkDMGraphPage />
    </RequireCurrentAccount>
  );
}
