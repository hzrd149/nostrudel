import { createIcon } from "@chakra-ui/icons";

const ChevronRightDouble = createIcon({
  displayName: "ChevronRightDouble",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M6 17L11 12L6 7M13 17L18 12L13 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ChevronRightDouble;
