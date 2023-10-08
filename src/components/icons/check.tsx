import { createIcon } from "@chakra-ui/icons";

const Check = createIcon({
  displayName: "Check",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M20 6L9 17L4 12"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default Check;
