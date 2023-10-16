import { createIcon } from "@chakra-ui/icons";

const ChevronDown = createIcon({
  displayName: "ChevronDown",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M6 9L12 15L18 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ChevronDown;
