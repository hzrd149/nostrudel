import { useCallback } from "react";
import {
  Button,
  Checkbox,
  Divider,
  Flex,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/react";

import { AUDIO_TYPES, IMAGE_TYPES, TEXT_TYPES, VIDEO_TYPES } from "../../helpers/nostr/files";
import { unique } from "../../helpers/array";

export default function MimeTypePicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const toggleType = useCallback(
    (type: string) => {
      if (selected.includes(type)) {
        onChange(selected.filter((t) => t !== type));
      } else onChange(selected.concat(type));
    },
    [selected, onChange],
  );
  const toggleCategory = useCallback(
    (types: string[]) => {
      const selectedTypes = selected.filter((t) => types.includes(t));

      if (selectedTypes.length !== types.length) onChange(unique([...selected, ...types]));
      else onChange(selected.filter((t) => !types.includes(t)));
    },
    [selected, onChange],
  );

  const selectedImageTypes = selected.filter((t) => IMAGE_TYPES.includes(t));
  const selectedVideoTypes = selected.filter((t) => VIDEO_TYPES.includes(t));
  const selectedAudioTypes = selected.filter((t) => AUDIO_TYPES.includes(t));
  const selectedTextTypes = selected.filter((t) => TEXT_TYPES.includes(t));

  return (
    <Popover>
      <PopoverTrigger>
        <Button>{selected.length} Selected types</Button>
      </PopoverTrigger>
      <PopoverContent w="xl">
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverBody>
          <Flex gap="4">
            <Flex gap="2" direction="column">
              <Checkbox
                isIndeterminate={selectedImageTypes.length > 0 && selectedImageTypes.length !== IMAGE_TYPES.length}
                isChecked={selectedImageTypes.length === IMAGE_TYPES.length}
                onChange={() => toggleCategory(IMAGE_TYPES)}
              >
                Images
              </Checkbox>
              <Divider />
              {IMAGE_TYPES.map((type) => (
                <Checkbox key={type} isChecked={selected.includes(type)} onChange={() => toggleType(type)}>
                  {type}
                </Checkbox>
              ))}
            </Flex>
            <Flex gap="2" direction="column">
              <Checkbox
                isIndeterminate={selectedVideoTypes.length > 0 && selectedVideoTypes.length !== VIDEO_TYPES.length}
                isChecked={selectedVideoTypes.length === VIDEO_TYPES.length}
                onChange={() => toggleCategory(VIDEO_TYPES)}
              >
                Videos
              </Checkbox>
              <Divider />
              {VIDEO_TYPES.map((type) => (
                <Checkbox key={type} isChecked={selected.includes(type)} onChange={() => toggleType(type)}>
                  {type}
                </Checkbox>
              ))}
            </Flex>
            <Flex gap="2" direction="column">
              <Checkbox
                isIndeterminate={selectedAudioTypes.length > 0 && selectedAudioTypes.length !== AUDIO_TYPES.length}
                isChecked={selectedAudioTypes.length === AUDIO_TYPES.length}
                onChange={() => toggleCategory(AUDIO_TYPES)}
              >
                Audio
              </Checkbox>
              <Divider />
              {AUDIO_TYPES.map((type) => (
                <Checkbox key={type} isChecked={selected.includes(type)} onChange={() => toggleType(type)}>
                  {type}
                </Checkbox>
              ))}
            </Flex>
            <Flex gap="2" direction="column">
              <Checkbox
                isIndeterminate={selectedTextTypes.length > 0 && selectedTextTypes.length !== TEXT_TYPES.length}
                isChecked={selectedTextTypes.length === TEXT_TYPES.length}
                onChange={() => toggleCategory(TEXT_TYPES)}
              >
                Text
              </Checkbox>
              <Divider />
              {TEXT_TYPES.map((type) => (
                <Checkbox key={type} isChecked={selected.includes(type)} onChange={() => toggleType(type)}>
                  {type}
                </Checkbox>
              ))}
            </Flex>
          </Flex>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
