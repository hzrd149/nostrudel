import { RefType } from "../components/magic-textarea";

export default function insertTextIntoMagicTextarea(
  instance: RefType,
  getText: () => string,
  setText: (text: string) => void,
  text: string,
) {
  const content = getText();
  const position = instance.getCaretPosition();

  if (position !== undefined) {
    let inject = text;

    // add a space before
    if (position >= 1 && content.slice(position - 1, position) !== " ") inject = " " + inject;
    // add a space after
    if (position < content.length && content.slice(position, position + 1) !== " ") inject = inject + " ";

    setText(content.slice(0, position) + inject + content.slice(position));
  } else {
    let inject = text;

    // add a space before if there isn't one
    if (content.slice(content.length - 1) !== " ") inject = " " + inject;

    setText(content + inject + " ");
  }
}
