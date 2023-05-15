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
  InputProps,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import useAppSettings from "../../hooks/use-app-settings";

function ColorPicker({ value, onPickColor, ...props }: { onPickColor?: (color: string) => void } & InputProps) {
  const [tmpColor, setTmpColor] = useState(value);
  const ref = useRef<HTMLInputElement>();

  useEffect(() => setTmpColor(value), [value]);
  useEffect(() => {
    if (ref.current) {
      ref.current.onchange = () => {
        if (onPickColor && ref.current?.value) {
          onPickColor(ref.current.value);
        }
      };
    }
  });

  return (
    <Input
      {...props}
      ref={ref}
      value={tmpColor}
      onChange={(e) => {
        setTmpColor(e.target.value);
        if (props.onChange) props.onChange(e);
      }}
    />
  );
}

export default function DisplaySettings() {
  const { blurImages, colorMode, primaryColor, updateSettings, showContentWarning } = useAppSettings();

  return (
    <AccordionItem>
      <h2>
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            Display
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
        <Flex direction="column" gap="4">
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="use-dark-theme" mb="0">
                Use dark theme
              </FormLabel>
              <Switch
                id="use-dark-theme"
                isChecked={colorMode === "dark"}
                onChange={(v) => updateSettings({ colorMode: v.target.checked ? "dark" : "light" })}
              />
            </Flex>
            <FormHelperText>
              <span>Enables hacker mode</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="primary-color" mb="0">
                Primary Color
              </FormLabel>
              <ColorPicker
                id="primary-color"
                type="color"
                value={primaryColor}
                onPickColor={(color) => updateSettings({ primaryColor: color })}
                maxW="120"
                size="sm"
              />
            </Flex>
            <FormHelperText>
              <span>The primary color of the theme</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="blur-images" mb="0">
                Blur images from strangers
              </FormLabel>
              <Switch
                id="blur-images"
                isChecked={blurImages}
                onChange={(v) => updateSettings({ blurImages: v.target.checked })}
              />
            </Flex>
            <FormHelperText>
              <span>Enabled: blur images for people you aren't following</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="show-content-warning" mb="0">
                Show content warning
              </FormLabel>
              <Switch
                id="show-content-warning"
                isChecked={showContentWarning}
                onChange={(v) => updateSettings({ showContentWarning: v.target.checked })}
              />
            </Flex>
            <FormHelperText>
              <span>Enabled: shows a warning for notes with NIP-36 Content Warning</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="show-ads" mb="0">
                Show Ads
              </FormLabel>
              <Switch
                id="show-ads"
                isChecked={false}
                onChange={(v) => alert("Sorry, that feature will never be finished.")}
              />
            </Flex>
            <FormHelperText>
              <span>Enabled: shows ads so I can steal your data</span>
            </FormHelperText>
          </FormControl>
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
}
