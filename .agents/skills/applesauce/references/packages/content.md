# applesauce-content

applesauce package for parsing text note content

## Example

```ts
import { getParsedContent } from "applesauce-content/text";

const stringContent = `
hello nostr!
nostr:npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6
`;
const ats = getParsedContent(stringContent);

console.log(ats);
/*
{
  type: 'root',
  event: undefined,
  children: [
    { type: 'text', value: 'hello nostr!' },
    { type: 'text', value: '\n' },
    {
      type: 'mention',
      decoded: [Object],
      encoded: 'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6'
    }
  ]
}
*/
```
