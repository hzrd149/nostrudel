import {
  ButtonGroup,
  CloseButton,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Select,
} from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { LooseEventTemplate } from "../../process";

import MagicTextArea from "../../../../../components/magic-textarea";
import TimestampInput from "../datetime-input";
import Plus from "../../../../../components/icons/plus";
import Minus from "../../../../../components/icons/minus";

const KindOptions = (
  Object.entries(kinds).filter(([name, value]) => typeof value === "number") as [string, number][]
).sort((a, b) => a[1] - b[1]);

export default function EventTemplateEditor({
  draft,
  onChange,
}: {
  draft: LooseEventTemplate;
  onChange: (draft: LooseEventTemplate) => void;
}) {
  const setTagValue = (index: number, tagIndex: number, value: string) => {
    onChange({
      ...draft,
      tags: draft.tags.map((t, i) => {
        if (i === index) {
          const newTag = Array.from(t);
          newTag[tagIndex] = value;
          return newTag;
        }
        return t;
      }),
    });
  };

  const removeTag = (index: number) => {
    const tags = Array.from(draft.tags);
    tags.splice(index, 1);

    onChange({ ...draft, tags });
  };

  const addTagValue = (index: number) => {
    onChange({
      ...draft,
      tags: draft.tags.map((tag, i) => {
        if (i === index) return [...tag, ""];
        return tag;
      }),
    });
  };
  const removeTagValue = (index: number) => {
    onChange({
      ...draft,
      tags: draft.tags.map((tag, i) => {
        if (i === index) return tag.slice(0, -1);
        return tag;
      }),
    });
  };
  return (
    <Flex direction="column" gap="2">
      <FormControl>
        <FormLabel htmlFor="content">Kind</FormLabel>
        <Select value={draft.kind} onChange={(e) => onChange({ ...draft, kind: parseInt(e.target.value) })}>
          {KindOptions.map(([name, kind]) => (
            <option value={kind} key={name + kind}>
              {name} ({kind})
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="content">Content</FormLabel>
        <MagicTextArea
          id="content"
          name="content"
          value={draft.content}
          onChange={(e) => onChange({ ...draft, content: e.target.value })}
        />
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="content">Created At</FormLabel>
        <TimestampInput
          timestamp={typeof draft.created_at === "number" ? draft.created_at : undefined}
          onChange={(ts) => onChange({ ...draft, created_at: ts })}
        />
      </FormControl>

      <Flex gap="2" alignItems="center">
        <Heading size="sm">Tags</Heading>
        <IconButton
          size="xs"
          ml="auto"
          colorScheme="primary"
          icon={<Plus boxSize={5} />}
          aria-label="Add Tag"
          onClick={() => onChange({ ...draft, tags: [...draft.tags, ["tag", "value"]] })}
        />
      </Flex>

      {draft.tags.map((tag, index) => (
        <Flex key={index} gap="2" alignItems="center" wrap="wrap">
          {tag.map((v, i) => (
            <Input
              key={i}
              value={v}
              onChange={(e) => setTagValue(index, i, e.target.value)}
              minW={i === 0 ? undefined : "xs"}
              maxW={i === 0 ? "40" : undefined}
              fontWeight={i === 0 ? "bold" : undefined}
              w="auto"
              flex={1}
            />
          ))}
          <ButtonGroup isAttached ml="auto">
            <IconButton
              size="sm"
              ml="auto"
              icon={<Plus boxSize={5} />}
              aria-label="Add Tag"
              onClick={() => addTagValue(index)}
            />
            <IconButton
              size="sm"
              ml="auto"
              icon={<Minus boxSize={5} />}
              aria-label="Add Tag"
              onClick={() => removeTagValue(index)}
              isDisabled={tag.length === 1}
            />
            <CloseButton onClick={() => removeTag(index)} />
          </ButtonGroup>
        </Flex>
      ))}
    </Flex>
  );
}
