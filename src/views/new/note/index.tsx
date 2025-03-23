import ShortTextNoteForm from "./short-text-form";
import SimpleView from "../../../components/layout/presets/simple-view";

export default function NewNoteView() {
  return (
    <SimpleView title="New note" center maxW="4xl">
      <ShortTextNoteForm />
    </SimpleView>
  );
}
