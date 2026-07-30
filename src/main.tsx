import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  return (
    <main className="placeholder">
      <p className="eyebrow">IDS Agent test fixture</p>
      <h1>FaultyMart is stocking the shelves.</h1>
      <p>A deliberately imperfect storefront is coming in the next commit.</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

