import { createIcon } from "@chakra-ui/icons";

const CurrencyRupee = createIcon({
  displayName: "CurrencyRupee",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M6 3H18M6 8H18M14.5 21L6 13H9C15.667 13 15.667 3 9 3"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default CurrencyRupee;
