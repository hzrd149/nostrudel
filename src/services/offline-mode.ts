import { PersistentSubject } from "../classes/subject";

export const offlineMode = new PersistentSubject(localStorage.getItem("offline-mode") === "true");
offlineMode.subscribe((v) => localStorage.setItem("offline-mode", v ? "true" : "false"));
