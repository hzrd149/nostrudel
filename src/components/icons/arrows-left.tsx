import { createIcon } from "@chakra-ui/icons";

const ArrowsLeft = createIcon({
  displayName: "ArrowsLeft",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M20 17H4M4 17L8 21M4 17L8 13M20 7H9M9 7L13 11M9 7L13 3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowsLeft;
