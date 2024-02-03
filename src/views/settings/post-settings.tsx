import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  Flex,
  FormControl,
  FormLabel,
  AccordionItem,
  AccordionPanel,
  AccordionButton,
  Box,
  AccordionIcon,
  FormHelperText,
  Input,
  Divider,
  Tag,
  TagLabel,
  TagCloseButton,
  useDisclosure,
  IconButton,
  Button,
} from "@chakra-ui/react";
import { matchSorter } from "match-sorter";

import { AppSettings } from "../../services/settings/migrations";
import { AppearanceIcon, EditIcon, NotesIcon } from "../../components/icons";
import { useContextEmojis } from "../../providers/global/emoji-provider";

export default function PostSettings() {
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
          <NotesIcon mr="2" />
          <Box as="span" flex="1" textAlign="left">
            Post
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel>
        <Flex direction="column" gap="4">
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
            <FormLabel htmlFor="noteDifficulty" mb="0">
              Proof of work
            </FormLabel>
            <Input
              id="noteDifficulty"
              {...register("noteDifficulty", { min: 0, max: 64, valueAsNumber: true })}
              step={1}
              maxW="xs"
            />
            <FormHelperText>
              <span>How much Proof of work to mine when writing notes. setting this to 0 will disable it</span>
            </FormHelperText>
          </FormControl>
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
}
