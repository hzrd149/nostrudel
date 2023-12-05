import { ReactNode } from "react";
import { Select, SelectProps } from "@chakra-ui/react";
import { Category, torrentCatagories } from "../../../helpers/nostr/torrents";

export default function CategorySelect({ ...props }: Omit<SelectProps, "children">) {
  function renderCategory(a: Category, tags: Array<string>): ReactNode {
    return (
      <>
        <option value={tags.join(",")}>{a.name}</option>
        {a.sub_category?.map((b) => renderCategory(b, [...tags, b.tag]))}
      </>
    );
  }

  return (
    <Select {...props}>
      <option value="">All</option>
      {torrentCatagories.map((category) => (
        <optgroup key={category.tag} label={category.name}>
          {renderCategory(category, [category.tag])}
        </optgroup>
      ))}
    </Select>
  );
}
