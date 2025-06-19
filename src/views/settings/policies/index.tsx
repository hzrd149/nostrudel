import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Switch,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { useCallback, useState } from "react";

import SimpleView from "../../../components/layout/presets/simple-view";
import { useAppTitle } from "../../../hooks/use-app-title";
import {
  EventPolicyRule,
  HideHashtagsRule,
  HideWordsRule,
  MaxHashtagsRule,
  SocialGraphDistanceRule,
} from "../../../services/event-policies";
import localSettings from "../../../services/local-settings";

function RuleCard({
  name,
  children,
  disabled,
  onToggle,
  onRemove,
}: {
  name: string;
  children: React.ReactNode;
  disabled?: boolean;
  onToggle: (disabled: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <Card size="sm" rounded="md">
      <CardBody>
        <Flex justify="space-between" align="center">
          <Text fontWeight="medium">{name}</Text>
          <HStack spacing={2}>
            <Switch isChecked={!disabled} onChange={(e) => onToggle(!e.target.checked)} />
            <IconButton
              size="sm"
              icon={<DeleteIcon />}
              aria-label="Remove rule"
              onClick={onRemove}
              variant="ghost"
              colorScheme="red"
            />
          </HStack>
        </Flex>
        {children}
      </CardBody>
    </Card>
  );
}

interface RuleComponentProps<Rule extends EventPolicyRule> {
  rule: Rule;
  index: number;
  onUpdate: (index: number, rule: Rule) => void;
  onRemove: (index: number) => void;
}

function SocialGraphDistanceRuleComponent({
  rule,
  index,
  onUpdate,
  onRemove,
}: RuleComponentProps<SocialGraphDistanceRule>) {
  const socialRule = rule.type === "social-graph-distance" ? rule : null;
  if (!socialRule) return null;

  return (
    <RuleCard
      name="Social Graph Distance"
      disabled={rule.disabled}
      onToggle={(disabled) => onUpdate(index, { ...rule, disabled })}
      onRemove={() => onRemove(index)}
    >
      <Text fontSize="sm" color="gray.500" mb={2}>
        Ensure author is within a set distance of you in the social graph
      </Text>
      <NumberInput
        value={socialRule.distance}
        min={0}
        max={10}
        onChange={(_, value) => onUpdate(index, { ...socialRule, distance: isNaN(value) ? 0 : value })}
      >
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
      <Text fontSize="sm" color="gray.500" mt={1}>
        0 = only you, 1 = friends, 2 = friends of friends, etc.
      </Text>
    </RuleCard>
  );
}

function MaxHashtagsRuleComponent({ rule, index, onUpdate, onRemove }: RuleComponentProps<MaxHashtagsRule>) {
  const hashtagRule = rule.type === "max-hashtags" ? rule : null;
  if (!hashtagRule) return null;

  return (
    <RuleCard
      name="Maximum Hashtags"
      disabled={rule.disabled}
      onToggle={(disabled) => onUpdate(index, { ...rule, disabled })}
      onRemove={() => onRemove(index)}
    >
      <Text fontSize="sm" color="gray.500" mb={2}>
        Maximum number of hashtags allowed in an event.
      </Text>
      <NumberInput
        value={hashtagRule.max}
        min={0}
        onChange={(_, value) => onUpdate(index, { ...hashtagRule, max: isNaN(value) ? 0 : value })}
      >
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
    </RuleCard>
  );
}

function HideWordsRuleComponent({ rule, index, onUpdate, onRemove }: RuleComponentProps<HideWordsRule>) {
  const wordsRule = rule.type === "hide-words" ? rule : null;
  const [newWord, setNewWord] = useState("");

  if (!wordsRule) return null;

  const addWord = () => {
    if (newWord.trim() && !wordsRule.words.includes(newWord.trim())) {
      onUpdate(index, { ...wordsRule, words: [...wordsRule.words, newWord.trim()] });
      setNewWord("");
    }
  };

  const removeWord = (wordToRemove: string) => {
    onUpdate(index, { ...wordsRule, words: wordsRule.words.filter((w) => w !== wordToRemove) });
  };

  return (
    <RuleCard
      name="Hide Words"
      disabled={rule.disabled}
      onToggle={(disabled) => onUpdate(index, { ...rule, disabled })}
      onRemove={() => onRemove(index)}
    >
      <Text fontSize="sm" color="gray.500" mb={2}>
        Hide events that contain these words.
      </Text>
      <VStack spacing={3} align="stretch">
        <HStack>
          <Input
            placeholder="Enter word to hide"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addWord()}
          />
          <Button onClick={addWord} leftIcon={<AddIcon />}>
            Add
          </Button>
        </HStack>
        {wordsRule.words.length > 0 && (
          <Flex wrap="wrap" gap={2}>
            {wordsRule.words.map((word) => (
              <Tag key={word} size="md" colorScheme="red" variant="subtle">
                <TagLabel>{word}</TagLabel>
                <TagCloseButton onClick={() => removeWord(word)} />
              </Tag>
            ))}
          </Flex>
        )}
      </VStack>
    </RuleCard>
  );
}

function HideHashtagsRuleComponent({ rule, index, onUpdate, onRemove }: RuleComponentProps<HideHashtagsRule>) {
  const [newHashtag, setNewHashtag] = useState("");

  const addHashtag = () => {
    const cleanHashtag = newHashtag.trim().replace(/^#/, "").toLocaleLowerCase();
    if (cleanHashtag && !rule.hashtags.includes(cleanHashtag)) {
      onUpdate(index, { ...rule, hashtags: [...rule.hashtags, cleanHashtag] });
      setNewHashtag("");
    }
  };

  const removeHashtag = (hashtagToRemove: string) => {
    onUpdate(index, {
      ...rule,
      hashtags: rule.hashtags.filter((h) => h !== hashtagToRemove),
    });
  };

  return (
    <RuleCard
      name="Hide Hashtags"
      disabled={rule.disabled}
      onToggle={(disabled) => onUpdate(index, { ...rule, disabled })}
      onRemove={() => onRemove(index)}
    >
      <Text fontSize="sm" color="gray.500" mb={2}>
        Hide events that contain these hashtags.
      </Text>
      <VStack spacing={3} align="stretch">
        <HStack>
          <Input
            placeholder="Enter hashtag to hide (without #)"
            value={newHashtag}
            onChange={(e) => setNewHashtag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHashtag()}
          />
          <Button onClick={addHashtag} leftIcon={<AddIcon />}>
            Add
          </Button>
        </HStack>
        {rule.hashtags.length > 0 && (
          <Flex wrap="wrap" gap={2}>
            {rule.hashtags.map((hashtag) => (
              <Tag key={hashtag} size="md" colorScheme="red" variant="subtle">
                <TagLabel>#{hashtag}</TagLabel>
                <TagCloseButton onClick={() => removeHashtag(hashtag)} />
              </Tag>
            ))}
          </Flex>
        )}
      </VStack>
    </RuleCard>
  );
}

function RuleComponent(props: RuleComponentProps<any>) {
  switch (props.rule.type) {
    case "social-graph-distance":
      return <SocialGraphDistanceRuleComponent {...props} />;
    case "max-hashtags":
      return <MaxHashtagsRuleComponent {...props} />;
    case "hide-words":
      return <HideWordsRuleComponent {...props} />;
    case "hide-hashtags":
      return <HideHashtagsRuleComponent {...props} />;
    default:
      return null;
  }
}

interface PolicySectionProps {
  title: string;
  description: string;
  rules: EventPolicyRule[];
  onUpdateRules: (rules: EventPolicyRule[]) => void;
}

function PolicySection({ title, description, rules, onUpdateRules }: PolicySectionProps) {
  const [newRuleType, setNewRuleType] = useState<EventPolicyRule["type"]>("social-graph-distance");

  const updateRule = useCallback(
    (index: number, rule: EventPolicyRule) => {
      const newRules = [...rules];
      newRules[index] = rule;
      onUpdateRules(newRules);
    },
    [rules, onUpdateRules],
  );

  const removeRule = useCallback(
    (index: number) => {
      const newRules = rules.filter((_, i) => i !== index);
      onUpdateRules(newRules);
    },
    [rules, onUpdateRules],
  );

  const addRule = useCallback(() => {
    let newRule: EventPolicyRule;

    switch (newRuleType) {
      case "social-graph-distance":
        newRule = { type: "social-graph-distance", distance: 3 };
        break;
      case "max-hashtags":
        newRule = { type: "max-hashtags", max: 5 };
        break;
      case "hide-words":
        newRule = { type: "hide-words", words: [] };
        break;
      case "hide-hashtags":
        newRule = { type: "hide-hashtags", hashtags: [] };
        break;
      default:
        return;
    }

    onUpdateRules([...rules, newRule]);
  }, [newRuleType, rules, onUpdateRules]);

  return (
    <Flex direction="column" gap="2">
      <Box>
        <Heading size="md">{title}</Heading>
        <Text color="gray.500" fontSize="sm">
          {description}
        </Text>
      </Box>
      <VStack spacing={4} align="stretch">
        {rules.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            No filtering rules applied - all content will be shown
          </Alert>
        ) : (
          rules.map((rule, index) => (
            <RuleComponent key={index} rule={rule} index={index} onUpdate={updateRule} onRemove={removeRule} />
          ))
        )}

        <Box>
          <Heading size="sm" mb={3}>
            Add New Rule
          </Heading>
          <HStack>
            <Select
              value={newRuleType}
              onChange={(e) => setNewRuleType(e.target.value as EventPolicyRule["type"])}
              maxW="300px"
            >
              <option value="social-graph-distance">Social Graph Distance</option>
              <option value="max-hashtags">Maximum Hashtags</option>
              <option value="hide-words">Hide Words</option>
              <option value="hide-hashtags">Hide Hashtags</option>
            </Select>
            <Button leftIcon={<AddIcon />} onClick={addRule}>
              Add Rule
            </Button>
          </HStack>
        </Box>
      </VStack>
    </Flex>
  );
}

export default function ContentPoliciesSettings() {
  useAppTitle("Content Policies");

  const eventsPolicy = useObservableEagerState(localSettings.eventsPolicy);
  const mediaPolicy = useObservableEagerState(localSettings.mediaPolicy);
  const embedsPolicy = useObservableEagerState(localSettings.embedsPolicy);

  const setEventsPolicy = (rules: EventPolicyRule[]) => localSettings.eventsPolicy.next(rules);
  const setMediaPolicy = (rules: EventPolicyRule[]) => localSettings.mediaPolicy.next(rules);
  const setEmbedsPolicy = (rules: EventPolicyRule[]) => localSettings.embedsPolicy.next(rules);

  return (
    <SimpleView title="Content Policies" maxW="container.xl" gap="8">
      <PolicySection
        title="Events"
        description="Control what events (posts, replies, reactions, etc) are shown in the client"
        rules={eventsPolicy}
        onUpdateRules={setEventsPolicy}
      />

      <PolicySection
        title="Media"
        description="Control what media content is blurred or hidden"
        rules={mediaPolicy}
        onUpdateRules={setMediaPolicy}
      />

      <PolicySection
        title="Embeds"
        description="Control what events will render with embedded link cards and other embeds"
        rules={embedsPolicy}
        onUpdateRules={setEmbedsPolicy}
      />
    </SimpleView>
  );
}
