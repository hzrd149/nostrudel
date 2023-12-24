import { DVMResponse } from "../../../../helpers/nostr/dvm";
import TextToSpeechResult from "./tts-result";
import TextToSpeechStatus from "./tts-status";

export default function TextToSpeechResponse({ response }: { response: DVMResponse }) {
  if (response.result) return <TextToSpeechResult result={response.result} />;
  if (response.status) return <TextToSpeechStatus status={response.status} />;
  return null;
}
