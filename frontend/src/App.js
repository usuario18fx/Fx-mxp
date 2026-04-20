import { useState } from "react";
import "@/App.css";
import MapView from "./components/MapView";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="App" data-testid="app-container">
      <MapView />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;