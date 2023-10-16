import { createIcon } from "@chakra-ui/icons";

const ArrowsDown = createIcon({
  displayName: "ArrowsDown",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M17 4V15M17 15L13 11M17 15L21 11M7 4V20M7 20L3 16M7 20L11 16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowsDown;
