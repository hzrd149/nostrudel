import { createIcon } from "@chakra-ui/icons";

const ParagraphSpacing = createIcon({
  displayName: "ParagraphSpacing",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M21 10H13M21 6H13M21 14H13M21 18H13M6 20L6 4M6 20L3 17M6 20L9 17M6 4L3 7M6 4L9 7"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ParagraphSpacing;
