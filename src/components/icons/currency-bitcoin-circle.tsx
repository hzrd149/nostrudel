import { createIcon } from "@chakra-ui/icons";

const CurrencyBitcoinCircle = createIcon({
  displayName: "CurrencyBitcoinCircle",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M9.5 7.5H13.75C14.9926 7.5 16 8.50736 16 9.75C16 10.9926 14.9926 12 13.75 12H9.5H14.25C15.4926 12 16.5 13.0074 16.5 14.25C16.5 15.4926 15.4926 16.5 14.25 16.5H9.5M9.5 7.5H8M9.5 7.5V16.5M9.5 16.5H8M10 6V7.5M10 16.5V18M13 6V7.5M13 16.5V18M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default CurrencyBitcoinCircle;
