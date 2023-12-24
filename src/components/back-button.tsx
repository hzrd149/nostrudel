import { Button, ButtonProps } from "@chakra-ui/react";
import { ChevronLeftIcon } from "./icons";
import { useNavigate } from "react-router-dom";

export default function BackButton({ ...props }: Omit<ButtonProps, "onClick" | "children">) {
  const navigate = useNavigate();
  return (
    <Button leftIcon={<ChevronLeftIcon />} {...props} onClick={() => navigate(-1)}>
      Back
    </Button>
  );
}
