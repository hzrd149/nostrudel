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
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
}
