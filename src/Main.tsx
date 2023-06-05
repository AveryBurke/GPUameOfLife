import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
     <div className="container"><canvas width="512" height="512"></canvas></div>
  </React.StrictMode>
);