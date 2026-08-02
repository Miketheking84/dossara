import { createRoot } from "react-dom/client";

import { App } from "./App";
import styleSheet from "./styles.css?sheet";

document.adoptedStyleSheets = [...document.adoptedStyleSheets, styleSheet];

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Desktop renderer root element is missing.");
}

createRoot(rootElement).render(<App />);
