import { createIcon } from "@chakra-ui/icons";

const EqualNot = createIcon({
  displayName: "EqualNot",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M5 9H19M5 15H19M19 5L5 19"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default EqualNot;
