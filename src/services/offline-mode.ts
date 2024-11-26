import { BehaviorSubject } from "rxjs";

export const offlineMode = new BehaviorSubject(localStorage.getItem("offline-mode") === "true");
offlineMode.subscribe((v) => localStorage.setItem("offline-mode", v ? "true" : "false"));
