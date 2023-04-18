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
} from "@chakra-ui/react";
import appSettings, { replaceSettings } from "../../services/app-settings";
import useSubject from "../../hooks/use-subject";
import useAppSettings from "../../hooks/use-app-settings";
import { useEffect, useState } from "react";

export default function PerformanceSettings() {
  const { autoShowMedia, proxyUserMedia, showReactions, showSignatureVerification, updateSettings, imageProxy } =
    useAppSettings();

  const [proxyInput, setProxyInput] = useState(imageProxy);
  useEffect(() => setProxyInput(imageProxy), [imageProxy]);

  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
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
              <Switch
                id="proxy-user-media"
                isChecked={proxyUserMedia}
                onChange={(v) => updateSettings({ proxyUserMedia: v.target.checked })}
              />
            </Flex>
            <FormHelperText>
              <span>Enabled: Use media.nostr.band to get smaller profile pictures (saves ~50Mb of data)</span>
              <br />
              <span>Side Effect: Some user pictures may not load or may be outdated</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="image-proxy" mb="0">
              Image proxy service
            </FormLabel>
            <Input
              id="image-proxy"
              type="url"
              value={proxyInput}
              onChange={(e) => setProxyInput(e.target.value)}
              onBlur={() => {
                try {
                  const url = proxyInput ? new URL(proxyInput).toString() : "";
                  if (url !== imageProxy) {
                    updateSettings({ imageProxy: url });
                    setProxyInput(url);
                  }
                } catch (e) {}
              }}
            />
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
              <FormLabel htmlFor="auto-show-embeds" mb="0">
                Automatically show media
              </FormLabel>
              <Switch
                id="auto-show-embeds"
                isChecked={autoShowMedia}
                onChange={(v) => updateSettings({ autoShowMedia: v.target.checked })}
              />
            </Flex>
            <FormHelperText>Disabled: Images and videos will show expandable buttons</FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="show-reactions" mb="0">
                Show reactions
              </FormLabel>
              <Switch
                id="show-reactions"
                isChecked={showReactions}
                onChange={(v) => updateSettings({ showReactions: v.target.checked })}
              />
            </Flex>
            <FormHelperText>Enabled: Show reactions on notes</FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="show-sig-verify" mb="0">
                Show signature verification
              </FormLabel>
              <Switch
                id="show-sig-verify"
                isChecked={showSignatureVerification}
                onChange={(v) => updateSettings({ showSignatureVerification: v.target.checked })}
              />
            </Flex>
            <FormHelperText>Enabled: show signature verification on notes</FormHelperText>
          </FormControl>
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
}
