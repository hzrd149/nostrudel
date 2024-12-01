# 🌸 blossom-client-sdk

A client for manage blobs on blossom servers

[Documentation](https://hzrd149.github.io/blossom-client-sdk/classes/BlossomClient)

## Using the client

### Using the static methods

```js
import { BlossomClient } from "blossom-client-sdk/client";

async function signer(event) {
  return await window.nostr.signEvent(event);
}

// create an upload auth event
const uploadAuth = await BlossomClient.getUploadAuth(file, server, "Upload bitcoin.pdf");

// encode it using base64
const encodedAuthHeader = BlossomClient.encodeAuthorizationHeader(auth);

// manually make the request
const res = await fetch(new URL("/upload", server), {
  method: "PUT",
  body: file,
  headers: { authorization: encodedAuthHeader },
});

// or use the static method
const res = await BlossomClient.uploadBlob(server, file, uploadAuth);

// check if successful
if (res.ok) {
  console.log("Blob uploaded!");
}
```

### Using the class

The `BlossomClient` class can be used to talk to a single server

```js
import { BlossomClient } from "blossom-client-sdk";

async function signer(event) {
  return await window.nostr.signEvent(event);
}

const client = new BlossomClient("https://cdn.example.com", signer);

const pubkey = "266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5";
const blobs = await client.listBlobs(pubkey, undefined, true);
// passing true as the last argument will make it send an auth event with the list request
```

### Using with NDK

The `BlossomClient` class and methods optionally take a `signer` method that is used to sign the upload auth events

If your using NDK in your app you can use this method

```ts
const signer = async (draft: EventTemplate) => {
  // add the pubkey to the draft event
  const event: UnsignedEvent = { ...draft, pubkey: user.pubkey };
  // get the signature
  const sig = await ndk.signer!.sign(event);

  // return the event + id + sig
  return { ...event, sig, id: getEventHash(event) };
};
```

## Helper Methods

### Getting the hash from a URL

The `getHashFromURL` method will return the last SHA256 hash it finds in a URL

```js
import { getHashFromURL } from "blossom-client-sdk";

// blossom compatible URLs
console.log(
  getHashFromURL("https://cdn.example.com/b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553.pdf"),
);
// -> b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553

// non-blossom URLs
console.log(
  getHashFromURL(
    "https://cdn.example.com/266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5/media/b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553.pdf",
  ),
);
// -> b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553

// returns null when no hash is found
console.log(getHashFromURL("https://example.com/index.html"));
// -> null
```

### Handling broken images

This package also exports a few helper methods for handling broken images

The `handleImageFallbacks(image, getServers)` method listen for an `error` event on an `<img/>` element and if the element has a `data-pubkey` attribute. it will call `getServers` to ask for a list of blossom servers for the pubkey

```js
import { handleImageFallbacks, USER_BLOSSOM_SERVER_LIST_KIND, getServersFromServerListEvent } from "blossom-client-sdk";

const image = new Image();
image.src = "https://cdn.censorship.com/72cb99b689b4cfe1a9fb6937f779f3f9c65094bf0e6ac72a8f8261efa96653f5.png";

// set the pubkey from the kind 1 event this image was found it
image.dataset.pubkey = event.pubkey;

// this is called when
async function getServers(pubkey) {
  if (pubkey) {
    // use NDK to find the users blossom server list event (k:10063)
    const event = await ndk.fetchEvent({ kinds: [USER_BLOSSOM_SERVER_LIST_KIND], authors: [pubkey] });

    // if its found return a list of blossom servers
    if (event) return getServersFromServerListEvent(event);
  }
  return undefined;
}

// listen for "error" events
handleImageFallbacks(image, getServers);

document.body.appendChild(image);
```

## Other Examples

### List all blobs on a server

```js
import { BlossomClient } from "blossom-client-sdk";

async function signer(event) {
  return await window.nostr.signEvent(event);
}

const pubkey = "266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5";
const server = "https://cdn.example.com";

async function listBlobs() {
  try {
    return BlossomClient.listBlobs(server, pubkey);
  } catch (e) {
    if (e.status === 401) {
      const auth = await BlossomClient.getListAuth(signer, "List Blobs from " + server);
      return BlossomClient.listBlobs(server, pubkey, undefined, auth);
    }
  }
}
```

### Upload a single blob

```js
import { BlossomClient } from "blossom-client-sdk";

async function signer(event) {
  return await window.nostr.signEvent(event);
}

const client = new BlossomClient("https://cdn.example.com", signer);

const blobs = await client.listBlobs();

await client.uploadBlob(new File(["testing"], "test.txt"));
```

### Upload a single blob to multiple servers

```js
import { BlossomClient } from "blossom-client-sdk";

async function signer(event) {
  return await window.nostr.signEvent(event);
}

const servers = ["https://cdn.example.com", "https://cdn.other.com"];
const file = new File(["testing"], "test.txt");

const auth = await BlossomClient.getUploadAuth(file, signer, "Upload test.txt");

for (let server of servers) {
  await BlossomClient.uploadBlob(server, file, auth);
}
```
