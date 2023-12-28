import { useState } from "react";
import {
  Box,
  Flex,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useToast,
} from "@chakra-ui/react";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import { useSigningContext } from "../../../providers/global/signing-provider";
import { useNavigate } from "react-router-dom";
import useRouteStateValue from "../../../hooks/use-route-state-value";
import SelectFileStep from "./select-file-step";
import DetailsStep from "./details-step";
import PreviewStep from "./preview-step";
import ConfirmStep from "./confirm-step";

const steps = [{ title: "Select File" }, { title: "Details" }, { title: "Upload" }];

export default function ThingUploadView() {
  const navigate = useNavigate();
  const toast = useToast();
  const { requestSignature } = useSigningContext();

  const step = useRouteStateValue("step", 0);

  const [file, setFile] = useState<Blob>();
  const [fileURL, setFileURL] = useState<string>();
  const [hash, setHash] = useState<string>();
  const [name, setName] = useState<string>();
  const [summary, setSummary] = useState<string>();
  const [screenshot, setScreenshot] = useState<Blob>();

  const upload = async () => {
    try {
      //   const signed = await requestSignature(getDraft());
      //   const pub = new NostrPublishAction("Post", clientRelaysService.getWriteUrls(), signed);
    } catch (e) {
      if (e instanceof Error) {
        toast({ description: e.message, status: "error" });
      }
    }
  };

  const renderContent = () => {
    switch (step.value) {
      case 0:
        return (
          <SelectFileStep
            onSubmit={(values) => {
              setFile(values.file);
              if (values.fileURL) setFileURL(values.fileURL);
              setHash(values.hash);
              step.setValue(1, false);
            }}
          />
        );
      case 1:
        return (
          <DetailsStep
            onSubmit={(values) => {
              setName(values.name);
              setSummary(values.summary);
              step.setValue(2, false);
            }}
          />
        );
      case 2:
        return (
          <PreviewStep
            file={file!}
            onSubmit={(values) => {
              setScreenshot(values.screenshot);
              step.setValue(3, false);
            }}
          />
        );
      case 3:
        return <ConfirmStep name={name!} hash={hash!} summary={summary!} screenshot={screenshot!} onConfirm={upload} />;
    }
  };

  return (
    <VerticalPageLayout>
      <Stepper index={step.value}>
        {steps.map((step, index) => (
          <Step key={index}>
            <StepIndicator>
              <StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
            </StepIndicator>

            <Box flexShrink="0">
              <StepTitle>{step.title}</StepTitle>
              {/* {step.description && <StepDescription>{step.description}</StepDescription>} */}
            </Box>

            <StepSeparator />
          </Step>
        ))}
      </Stepper>
      {renderContent()}
    </VerticalPageLayout>
  );
}
