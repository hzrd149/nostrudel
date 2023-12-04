import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
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
  Select,
  Textarea,
  Divider,
  Tag,
  TagLabel,
  TagCloseButton,
  useDisclosure,
  IconButton,
  Button,
  Link,
} from "@chakra-ui/react";
import { matchSorter } from "match-sorter";

import { AppSettings } from "../../services/settings/migrations";
import { AppearanceIcon, EditIcon } from "../../components/icons";
import { useContextEmojis } from "../../providers/emoji-provider";

export default function DisplaySettings() {
  const { register, setValue, getValues, watch } = useFormContext<AppSettings>();
  const emojiPicker = useDisclosure();

  const emojis = useContextEmojis();
  const [emojiSearch, setEmojiSearch] = useState("");

  watch("quickReactions");
  const filteredEmojis = useMemo(() => {
    const values = getValues();
    if (emojiSearch.trim()) {
      const noCustom = emojis.filter((e) => e.char && !e.url && !values.quickReactions.includes(e.char));
      return matchSorter(noCustom, emojiSearch.trim(), { keys: ["keywords"] }).slice(0, 10);
    }
    return [];
  }, [emojiSearch, getValues().quickReactions]);

  const addEmoji = (char: string) => {
    const values = getValues();
    if (values.quickReactions.includes(char)) return;
    setValue("quickReactions", values.quickReactions.concat(char), { shouldTouch: true, shouldDirty: true });
  };
  const removeEmoji = (char: string) => {
    const values = getValues();
    if (!values.quickReactions.includes(char)) return;
    setValue(
      "quickReactions",
      values.quickReactions.filter((e) => e !== char),
      { shouldTouch: true, shouldDirty: true },
    );
  };

  return (
    <AccordionItem>
      <h2>
        <AccordionButton fontSize="xl">
          <AppearanceIcon mr="2" />
          <Box as="span" flex="1" textAlign="left">
            Display
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
        <Flex direction="column" gap="4">
          <FormControl>
            <FormLabel htmlFor="theme" mb="0">
              Theme
            </FormLabel>
            <Select id="theme" {...register("theme")}>
              <option value="default">Default</option>
              <option value="chakraui">ChakraUI</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="colorMode" mb="0">
              Color Mode
            </FormLabel>
            <Select id="colorMode" {...register("colorMode")}>
              <option value="system">System Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="primaryColor" mb="0">
                Primary Color
              </FormLabel>
              <Input id="primaryColor" type="color" maxW="120" size="sm" {...register("primaryColor")} />
            </Flex>
            <FormHelperText>
              <span>The primary color of the theme</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="quickReactions" mb="0">
              Quick Reactions
            </FormLabel>
            <Flex gap="2" wrap="wrap">
              {getValues().quickReactions.map((char, i) => (
                <Tag key={char + i}>
                  <TagLabel>{char}</TagLabel>
                  {emojiPicker.isOpen && <TagCloseButton onClick={() => removeEmoji(char)} />}
                </Tag>
              ))}
              {!emojiPicker.isOpen && (
                <Button size="sm" onClick={emojiPicker.onOpen} leftIcon={<EditIcon />}>
                  Customize
                </Button>
              )}
            </Flex>
            {emojiPicker.isOpen && (
              <>
                <Divider my="2" />
                <Input
                  type="search"
                  w="sm"
                  h="8"
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  mb="2"
                />
                <Flex gap="2" wrap="wrap">
                  {filteredEmojis.map((emoji) => (
                    <IconButton
                      key={emoji.char}
                      icon={<span>{emoji.char}</span>}
                      aria-label={`Add ${emoji.name}`}
                      title={`Add ${emoji.name}`}
                      variant="outline"
                      size="sm"
                      fontSize="lg"
                      onClick={() => addEmoji(emoji.char)}
                    />
                  ))}
                </Flex>
              </>
            )}
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="maxPageWidth" mb="0">
              Max Page width
            </FormLabel>
            <Select id="maxPageWidth" {...register("maxPageWidth")}>
              <option value="none">None</option>
              <option value="md">Medium (~768px)</option>
              <option value="lg">Large (~992px)</option>
              <option value="xl">Extra Large (~1280px)</option>
            </Select>
            <FormHelperText>
              <span>Setting this will restrict the width of app on desktop</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="blurImages" mb="0">
                Blur media from strangers
              </FormLabel>
              <Switch id="blurImages" {...register("blurImages")} />
            </Flex>
            <FormHelperText>
              <span>Enabled: blur media from people you aren't following</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="hideUsernames" mb="0">
                Hide Usernames (anon mode)
              </FormLabel>
              <Switch id="hideUsernames" {...register("hideUsernames")} />
            </Flex>
            <FormHelperText>
              <span>
                Enabled: hides usernames and pictures.{" "}
                <Link
                  as={RouterLink}
                  color="blue.500"
                  to="/n/nevent1qqsxvkjgpc6zhydj4rxjpl0frev7hmgynruq027mujdgy2hwjypaqfspzpmhxue69uhkummnw3ezuamfdejszythwden5te0dehhxarjw4jjucm0d5sfntd0"
                >
                  Details
                </Link>
              </span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="show-content-warning" mb="0">
                Show content warning
              </FormLabel>
              <Switch id="show-content-warning" {...register("showContentWarning")} />
            </Flex>
            <FormHelperText>
              <span>Enabled: shows a warning for notes with NIP-36 Content Warning</span>
            </FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="muted-words" mb="0">
              Muted words
            </FormLabel>
            <Textarea id="muted-words" {...register("mutedWords")} placeholder="Broccoli, Spinach, Artichoke..." />
            <FormHelperText>
              <span>
                Comma separated list of words, phrases or hashtags you never want to see in notes. (case insensitive)
              </span>
              <br />
              <span>Be careful its easy to hide all notes if you add common words.</span>
            </FormHelperText>
          </FormControl>
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
}
