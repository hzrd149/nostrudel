import { DVMResponse } from "../../../../helpers/nostr/dvm";
import TranslationResult from "./translation-result";
import TranslationStatus from "./translation-status";

export default function TranslationResponse({ response }: { response: DVMResponse }) {
  if (response.result) return <TranslationResult result={response.result} />;
  if (response.status) return <TranslationStatus status={response.status} />;
  return null;
}
