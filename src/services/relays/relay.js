import { Signal } from "../../helpers/signal";

export class Relay {
  constructor(url) {
    this.url = url;

    this.onOpen = new Signal();
    this.onClose = new Signal();
    this.onEvent = new Signal();
    this.onNotice = new Signal();
  }

  open() {
    if (this.okay) return;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
  }
  send(json) {
    if (this.connected) {
      this.ws.send(JSON.stringify(json));
    }
  }
  close() {
    this.ws?.close();
  }

  get okay() {
    return this.connected || this.connecting;
  }
  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  get connecting() {
    return this.ws?.readyState === WebSocket.CONNECTING;
  }
  get state() {
    return this.ws?.readyState;
  }

  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      const type = data[0];

      switch (type) {
        case "EVENT":
          this.onEvent.emit({ type, subId: data[1], body: data[2] }, this);
          break;
        case "NOTICE":
          this.onNotice.emit({ type, message: data[1] }, this);
          break;
      }
    } catch (e) {
      console.log(`Failed to parse event from ${this.url}`);
      console.log(event);
    }
  }
  handleOpen() {
    this.onOpen.emit(this);

    if (import.meta.env.DEV) {
      console.info(`Relay ${this.url} opened`);
    }
  }
  handleClose() {
    this.onClose.emit(this);

    if (import.meta.env.DEV) {
      console.info(`Relay ${this.url} closed`);
    }
  }
}
