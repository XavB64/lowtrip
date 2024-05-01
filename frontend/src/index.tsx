import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import reportWebVitals from "./reportWebVitals";

const domNode = document.getElementById("root");
if (domNode) {
  const root = createRoot(domNode);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
