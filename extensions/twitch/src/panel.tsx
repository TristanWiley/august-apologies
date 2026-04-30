import { createRoot } from "react-dom/client";
import { MusicPlayer } from "./components/player";

import "./index.css";

export const PanelExtension = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <MusicPlayer />
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<PanelExtension />);
