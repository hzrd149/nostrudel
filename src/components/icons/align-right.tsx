import { createIcon } from "@chakra-ui/icons";

const AlignRight = createIcon({
  displayName: "AlignRight",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M21 10H8M21 6H4M21 14H4M21 18H8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default AlignRight;
