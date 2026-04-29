import { createRoot } from "react-dom/client";
import "../../../src/index.css";

export const ConfigExtension = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Twitch Extension</h1>
      <p className="text-center text-gray-600">
        Placeholder config page ready for Twitch Extension UI.
      </p>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<ConfigExtension />);
