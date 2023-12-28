import { useContext } from "react";
import { SatelliteCDNFile } from "../../../helpers/satellite-cdn";
import { PostModalContext } from "../../../providers/route/post-modal-provider";
import { ButtonProps, IconButton } from "@chakra-ui/react";
import { QuoteRepostIcon } from "../../../components/icons";

export type ShareFileButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  file: SatelliteCDNFile;
};

export default function ShareFileButton({
  file,
  "aria-label": ariaLabel,
  title = "Share File",
  ...props
}: ShareFileButtonProps) {
  const { openModal } = useContext(PostModalContext);

  const handleClick = () => {
    openModal({ cacheFormKey: null, initContent: "\n" + file.url });
  };

  return (
    <IconButton
      icon={<QuoteRepostIcon />}
      onClick={handleClick}
      aria-label={ariaLabel || title}
      title={title}
      {...props}
    />
  );
}
