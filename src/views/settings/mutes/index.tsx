import { VStack } from "@chakra-ui/react";

import SimpleView from "../../../components/layout/presets/simple-view";
import { useAppTitle } from "../../../hooks/use-app-title";
import MutedHashtagsSection from "./muted-hashtags";
import MutedThreadsSection from "./muted-threads";
import MutedWordsSection from "./muted-words";

export default function MutesSettings() {
  useAppTitle("Mutes");

  return (
    <SimpleView title="Mutes" maxW="container.xl" gap="8">
      <VStack spacing={8} align="stretch">
        <MutedWordsSection />
        <MutedHashtagsSection />
        <MutedThreadsSection />
      </VStack>
    </SimpleView>
  );
}
