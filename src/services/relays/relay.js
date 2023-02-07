import { Signal } from "../../helpers/signal";

export class Relay {
  constructor(url) {
    this.url = url;

    this.onOpen = new Signal();
    this.onClose = new Signal();
    this.onEvent = new Signal();
    this.onNotice = new Signal();

    this.connect();
  }

  connect() {
    if (this.connected || this.connecting) return;
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
    const data = JSON.parse(event.data);
    const type = data[0];

    switch (type) {
      case "EVENT":
        this.onEvent.emit({ subId: data[1], body: data[2] });
        break;
      case "NOTICE":
        this.onEvent.emit({ message: data[1] });
        break;
    }
  }
  handleOpen() {
    console.log(this.url, "connected");

    this.onOpen.emit();
  }
  handleClose() {
    console.log(this.url, "reconnecting in 10s");

    this.onClose.emit();
    setTimeout(() => {
      this.connect();
    }, 1000 * 10);
  }
}
