import { createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./lib/storage/localStorageShim";
import App from "./App";
import "@fontsource-variable/inter";
import "@fontsource-variable/montserrat";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No se encontró el elemento #root");
}

createRoot(rootElement).render(createElement(StrictMode, null, createElement(App)));
