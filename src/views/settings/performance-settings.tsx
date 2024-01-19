import { useFormContext } from "react-hook-form";
import {
  Flex,
  FormControl,
  FormLabel,
  Switch,
  AccordionItem,
  AccordionPanel,
  AccordionButton,
  Box,
  AccordionIcon,
  FormHelperText,
  Input,
  Link,
  FormErrorMessage,
  Code,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Text,
  Heading,
} from "@chakra-ui/react";
import { safeUrl } from "../../helpers/parse";
import { AppSettings } from "../../services/settings/migrations";
import { PerformanceIcon } from "../../components/icons";

export default function PerformanceSettings() {
  const { register, formState } = useFormContext<AppSettings>();
  const cacheDetails = useDisclosure();

  return (
    <AccordionItem>
      <h2>
        <AccordionButton fontSize="xl">
          <PerformanceIcon mr="2" />
          <Box as="span" flex="1" textAlign="left">
            Performance
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
        <Flex direction="column" gap="4">
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="proxy-user-media" mb="0">
                Proxy user media
              </FormLabel>
              <Switch id="proxy-user-media" {...register("proxyUserMedia")} />
            </Flex>
            <FormHelperText>
              <span>Enabled: Use media.nostr.band to get smaller profile pictures (saves ~50Mb of data)</span>
              <br />
              <span>Side Effect: Some user pictures may not load or may be outdated</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="imageProxy" mb="0">
              Image proxy service
            </FormLabel>
            <Input
              id="imageProxy"
              type="url"
              {...register("imageProxy", {
                setValueAs: (v) => safeUrl(v) || v,
              })}
            />
            {formState.errors.imageProxy && <FormErrorMessage>{formState.errors.imageProxy.message}</FormErrorMessage>}
            <FormHelperText>
              <span>
                A URL to an instance of{" "}
                <Link href="https://github.com/willnorris/imageproxy" isExternal target="_blank">
                  willnorris/imageproxy
                </Link>
              </span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="autoShowMedia" mb="0">
                Show embeds
              </FormLabel>
              <Switch id="autoShowMedia" {...register("autoShowMedia")} />
            </Flex>
            <FormHelperText>Disabled: Embeds will show an expandable button</FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="showReactions" mb="0">
                Show reactions
              </FormLabel>
              <Switch id="showReactions" {...register("showReactions")} />
            </Flex>
            <FormHelperText>Enabled: Show reactions on notes</FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="showSignatureVerification" mb="0">
                Show signature verification
              </FormLabel>
              <Switch id="showSignatureVerification" {...register("showSignatureVerification")} />
            </Flex>
            <FormHelperText>Enabled: show signature verification on notes</FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="localCacheRelay" mb="0">
                Local Cache Relay
              </FormLabel>
              <Switch id="localCacheRelay" isChecked={!!window.CACHE_RELAY_ENABLED} />
              <Button onClick={cacheDetails.onOpen} variant="link" ml="4">
                Details
              </Button>
            </Flex>
            <FormHelperText>Enabled: Use a local relay as a cache</FormHelperText>

            <Modal isOpen={cacheDetails.isOpen} onClose={cacheDetails.onClose} size="4xl">
              <ModalOverlay />
              <ModalContent>
                <ModalHeader p="4">Local cache relay</ModalHeader>
                <ModalCloseButton />
                <ModalBody px="4" pb="4" pt="0">
                  <Text>
                    When this is enabled noStrudel will connect to the relay at ws://{"<app domain>"}/local-relay and
                    use it to cache all events it finds.
                  </Text>
                  <Text>
                    For security reasons this can only be enabled when running the docker container and setting the
                    CACHE_RELAY env variable
                  </Text>
                  <Heading size="md" mt="2">
                    Docker compose example
                  </Heading>
                  <Text mt="2">
                    1. Create a docker-compose.yml file with nostr-rs-relay and noStrudel and set{" "}
                    <Code>CACHE_RELAY: relay:8080</Code>
                  </Text>
                  <Code whiteSpace="pre" w="full">
                    {`version: "3.7"
volumes:
  data: {}

services:
  relay:
    image: scsibug/nostr-rs-relay:0.8.13
    volumes:
      - data:/data
  app:
  image: ghcr.io/hzrd149/nostrudel:latest
    depends_on:
      - relay
    environment:
      CACHE_RELAY: relay:8080
    ports:
      - 8080:80
`.trim()}
                  </Code>
                  <Text mt="2">2. Start docker compose</Text>
                  <Code>docker compose up</Code>
                </ModalBody>
              </ModalContent>
            </Modal>
          </FormControl>
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
}
