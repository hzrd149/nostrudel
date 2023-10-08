import { createIcon } from "@chakra-ui/icons";

const ArrowsRight = createIcon({
  displayName: "ArrowsRight",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M4 7H15M15 7L11 11M15 7L11 3M4 17H20M20 17L16 21M20 17L16 13"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowsRight;
