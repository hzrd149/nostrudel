import { ButtonGroup, ButtonGroupProps, IconButton, IconButtonProps } from "@chakra-ui/react";
import { AtIcon, LightningIcon, QuoteIcon, ReplyIcon, RepostIcon } from "../../components/icons";
import Heart from "../../components/icons/heart";
import HelpCircle from "../../components/icons/help-circle";

type Disclosure = { isOpen: boolean; onToggle: () => void };

function ToggleIconButton({ toggle, colorScheme, color, ...props }: IconButtonProps & { toggle: Disclosure }) {
  return (
    <IconButton
      // colorScheme={toggle.isOpen ? colorScheme || "primary" : undefined}
      color={toggle.isOpen ? color : undefined}
      variant={toggle.isOpen ? "outline" : "ghost"}
      onClick={toggle.onToggle}
      {...props}
    />
  );
}

type NotificationTypeTogglesPropTypes = Omit<ButtonGroupProps, "children"> & {
  showReplies: Disclosure;
  showMentions: Disclosure;
  showQuotes: Disclosure;
  showZaps: Disclosure;
  showReposts: Disclosure;
  showReactions: Disclosure;
  showUnknown: Disclosure;
};

export default function NotificationTypeToggles({
  showReplies,
  showMentions,
  showQuotes,
  showZaps,
  showReposts,
  showReactions,
  showUnknown,
  ...props
}: NotificationTypeTogglesPropTypes) {
  return (
    <ButtonGroup variant="outline" {...props}>
      <ToggleIconButton
        icon={<ReplyIcon boxSize={5} />}
        aria-label="Toggle replies"
        title="Toggle replies"
        toggle={showReplies}
        color="green.400"
      />
      <ToggleIconButton
        icon={<AtIcon boxSize={5} />}
        aria-label="Toggle mentions"
        title="Toggle mentions"
        toggle={showMentions}
        color="purple.400"
      />
      <ToggleIconButton
        icon={<QuoteIcon boxSize={5} />}
        aria-label="Toggle quotes"
        title="Toggle quotes"
        toggle={showQuotes}
        color="teal.400"
      />
      <ToggleIconButton
        icon={<LightningIcon boxSize={5} />}
        aria-label="Toggle zaps"
        title="Toggle zaps"
        toggle={showZaps}
        color="yellow.400"
      />
      <ToggleIconButton
        icon={<RepostIcon boxSize={5} />}
        aria-label="Toggle reposts"
        title="Toggle reposts"
        toggle={showReposts}
        color="blue.400"
      />
      <ToggleIconButton
        icon={<Heart boxSize={5} />}
        aria-label="Toggle reactions"
        title="Toggle reactions"
        toggle={showReactions}
        color="red.400"
      />
      <ToggleIconButton
        icon={<HelpCircle boxSize={5} />}
        aria-label="Toggle unknown"
        title="Toggle unknown"
        toggle={showUnknown}
        color="gray.500"
      />
    </ButtonGroup>
  );
}
