# 🌸 blossom-drive-sdk

`blossom-drive-sdk` is a library working with drives created in [blossom-drive](https://github.com/hzrd149/blossom-drive)

[Documentation](https://hzrd149.github.io/blossom-drive-sdk/)

## Working with drives

The `Drive` class can be used to easily manage the file tree inside a drive event `k:30563` ([Docs](https://github.com/hzrd149/blossom-drive/blob/master/docs/drive.md))

The `Drive` class takes two arguments, `signer` and `publisher`. The `signer` is an async method that takes an unsigned nostr event and returns a signed event. The `publisher` is a method used to "publish" the signed nostr event to some relays so it can be loaded later

The simplest `signer` and `publisher` would look something like

```js
import { Relay } from "nostr-tools/relay";
const relay = await Relay.connect("wss://relay.example.com");

async function signer(template) {
  return await window.nostr.signEvent(template);
}
function publisher(event) {
  relay.publish(event);
}
```

There are generally two ways to create a `Drive` class.

```js
// create a new empty drive
const drive = new Drive(signer, publisher);
drive.name = "Empty";
drive.description = "an empty drive";

// create a drive from an event
const drive = Drive.fromEvent(event, signer, publisher);
```

## Manage files and folder in a drive

Once you have create a drive you need to add some files to it

```js
// This will create a /bitcoin.pdf file in the drive set to a certain sha256
drive.setFile("/bitcoin.pdf", {
  sha256: "b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553",
  size: 184929,
  type: "application/pdf",
});

// Create an empty folder
drive.getFolder("/New Folder", true);

// Move a file
drive.move("/bitcoin.pdf", "/New Folder/bitcoin.pdf");

// Remove a file
drive.remove("/New Folder/bitcoin.pdf");
```

You can see all the methods for managing files in the [documentation](https://hzrd149.github.io/blossom-drive-sdk/classes/Drive)

## Working with encrypted drives

Encrypted drives use a different event kind `k:30564` than normal drives

The `EncryptedDrive` class is every similar to the `Drive` class but it has a few additional methods

- `unlock(password)` Attempts to decrypt and drive
- `lock()` Forgets the password and resets the drive
- `setPassword(password)` Used to set the password on a newly created drive

You can read more [here](https://hzrd149.github.io/blossom-drive-sdk/classes/EncryptedDrive)

## Examples

### Create a new drive

```js
import { Relay } from "nostr-tools/relay";
import { DRIVE_KIND, Drive } from "blossom-drive-sdk";

async function signer(template) {
  return await window.nostr.signEvent(template);
}

const relay = await Relay.connect("wss://relay.example.com");
function publisher(event) {
  relay.publish(event);
}

const drive = new Drive(signer, publisher);
drive.name = "New Drive";
drive.description = "A test drive";

// add a file
drive.setFile("/bitcoin.pdf", {
  sha256: "b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553",
  size: 184929,
  type: "application/pdf",
});

// create an empty folder
drive.getFolder("/New Folder", true);

// finally save the drive to nostr
await drive.save();
```

### Create a drive from an events

```js
import { Relay } from "nostr-tools/relay";
import { DRIVE_KIND, Drive } from "blossom-drive-sdk";

function signer(template) {
  return window.nostr.signEvent(template);
}
function publisher(event) {
  relay.publish(event);
}

const relay = await Relay.connect("wss://relay.example.com");

const pubkey = await window.nostr.getPublicKey();

const driveEvents = [];
const sub = relay.subscribe([{ kinds: [DRIVE_KIND], author: [pubkey] }], {
  onevent(event) {
    driveEvents.push(event);
  },
  oneose() {
    sub.close();

    const drives = [];
    for (let event of driveEvents) {
      // create drive class from an event
      const drive = Drive.fromEvent(event, signer, publisher);
    }
  },
});
```

### Update a drive from an event

```js
import { Relay } from "nostr-tools/relay";
import { DRIVE_KIND, Drive } from "blossom-drive-sdk";

function signer(template) {
  return window.nostr.signEvent(template);
}

const relay = await Relay.connect("wss://relay.example.com");
function publisher(event) {
  relay.publish(event);
}

const drive = new Drive(signer, publisher);

const driveEvents = [];
const sub = relay.subscribe([{ kinds: [DRIVE_KIND], "#d": ["random"] }], {
  onevent(event) {
    drive.update(event);
  },
});
```
