import { Flex, Heading } from "@chakra-ui/react";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import ShortTextNoteForm from "./short-text-form";
import BackButton from "../../../components/router/back-button";

export default function NewNoteView() {
  return (
    <VerticalPageLayout mx="auto" maxW="4xl" w="full">
      <Flex gap="2" alignItems="center">
        <BackButton />
        <Heading>New note</Heading>
      </Flex>

      <ShortTextNoteForm />
    </VerticalPageLayout>
  );
}
