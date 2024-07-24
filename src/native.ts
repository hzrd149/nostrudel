import { App } from "@capacitor/app";

App.addListener("backButton", () => history.go(-1));
