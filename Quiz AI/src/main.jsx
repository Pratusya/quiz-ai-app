import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress all console output except errors
const originalConsoleError = console.error;
console.log = () => {};
console.info = () => {};
console.warn = () => {};
console.debug = () => {};
console.error = (...args) => {
  // Filter out React DevTools message
  if (args[0]?.includes?.("Download the React DevTools")) return;
  originalConsoleError.apply(console, args);
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
