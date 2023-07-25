import React from "react";
import { AsynContexProvider } from "./contexts/Context";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AsynContexProvider>
      <App />
    </AsynContexProvider>
  </React.StrictMode>
);