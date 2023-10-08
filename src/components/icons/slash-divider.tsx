import { createIcon } from "@chakra-ui/icons";

const SlashDivider = createIcon({
  displayName: "SlashDivider",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M7 22L17 2"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default SlashDivider;
