import {
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  useDisclosure,
} from "@chakra-ui/react";
import { useAppTitle } from "../../hooks/use-app-title";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import VerticalPageLayout from "../../components/vertical-page-layout";
import Plus from "../../components/icons/plus";
import useUserPodcasts from "../../hooks/use-user-podcasts";
import { getFeedPointers } from "../../helpers/nostr/podcasts";
import PodcastFeedCard from "./components/podcast-feed-card";
import AddFeedForm from "./components/add-feed-form";

export default function PodcastsHomeView() {
  useAppTitle("Podcasts");

  const add = useDisclosure();

  const list = useUserPodcasts();
  const feeds = list ? getFeedPointers(list) : [];

  return (
    <VerticalPageLayout>
      <Flex>
        <Heading size="lg">Podcasts</Heading>
        <Button ms="auto" leftIcon={<Plus boxSize={6} />} colorScheme="primary" onClick={add.onOpen}>
          Add
        </Button>
      </Flex>

      <Heading size="md">Subscribed</Heading>
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="2">
        {feeds.map((feed) => (
          <PodcastFeedCard
            key={feed.guid}
            pointer={feed}
            to={`/podcasts/${feed.guid}?feed=${encodeURIComponent(feed.url.toString())}`}
          />
        ))}
      </SimpleGrid>

      {add.isOpen && (
        <Modal isOpen={add.isOpen} onClose={add.onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader p="4">Add feed</ModalHeader>
            <ModalCloseButton />
            <ModalBody px="4" pb="4" pt="0">
              <AddFeedForm onAdded={add.onClose} />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </VerticalPageLayout>
  );
}
