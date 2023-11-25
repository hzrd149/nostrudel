import { ButtonGroup, ButtonGroupProps, IconButton, IconButtonProps } from "@chakra-ui/react";
import { AtIcon, LightningIcon, ReplyIcon, RepostIcon } from "../../components/icons";
import Heart from "../../components/icons/heart";

type Disclosure = { isOpen: boolean; onToggle: () => void };

function ToggleIconButton({ toggle, ...props }: IconButtonProps & { toggle: Disclosure }) {
  return <IconButton colorScheme={toggle.isOpen ? "primary" : undefined} onClick={toggle.onToggle} {...props} />;
}

type NotificationTypeTogglesPropTypes = Omit<ButtonGroupProps, "children"> & {
  showReplies: Disclosure;
  showMentions: Disclosure;
  showZaps: Disclosure;
  showReposts: Disclosure;
  showReactions: Disclosure;
};

export default function NotificationTypeToggles({
  showReplies,
  showMentions,
  showZaps,
  showReposts,
  showReactions,
  ...props
}: NotificationTypeTogglesPropTypes) {
  return (
    <ButtonGroup variant="outline" {...props}>
      <ToggleIconButton
        icon={<ReplyIcon boxSize={5} />}
        aria-label="Toggle replies"
        title="Toggle replies"
        toggle={showReplies}
      />
      <ToggleIconButton
        icon={<AtIcon boxSize={5} />}
        aria-label="Toggle reposts"
        title="Toggle reposts"
        toggle={showMentions}
      />
      <ToggleIconButton
        icon={<LightningIcon boxSize={5} />}
        aria-label="Toggle zaps"
        title="Toggle zaps"
        toggle={showZaps}
      />
      <ToggleIconButton
        icon={<RepostIcon boxSize={5} />}
        aria-label="Toggle reposts"
        title="Toggle reposts"
        toggle={showReposts}
      />
      <ToggleIconButton
        icon={<Heart boxSize={5} />}
        aria-label="Toggle reactions"
        title="Toggle reactions"
        toggle={showReactions}
      />
    </ButtonGroup>
  );
}
