import { createIcon } from "@chakra-ui/icons";

const ArrowUp = createIcon({
  displayName: "ArrowUp",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M12 19V5M12 5L5 12M12 5L19 12"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowUp;
