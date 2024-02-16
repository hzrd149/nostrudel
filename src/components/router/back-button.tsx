import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { ChevronLeftIcon } from "../icons";
import { useNavigate } from "react-router-dom";

export default function BackButton({ ...props }: Omit<IconButtonProps, "onClick" | "children" | "aria-label">) {
  const navigate = useNavigate();
  return (
    <IconButton icon={<ChevronLeftIcon />} aria-label="Back" {...props} onClick={() => navigate(-1)}>
      Back
    </IconButton>
  );
}
