import { createIcon } from "@chakra-ui/icons";

const ArrowsUp = createIcon({
  displayName: "ArrowsUp",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M7 20V4M7 4L3 8M7 4L11 8M17 20V9M17 9L13 13M17 9L21 13"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowsUp;
