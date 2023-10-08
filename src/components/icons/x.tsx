import { createIcon } from "@chakra-ui/icons";

const X = createIcon({
  displayName: "X",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M17 7L7 17M7 7L17 17"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default X;
