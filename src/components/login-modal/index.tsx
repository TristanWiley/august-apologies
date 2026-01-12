import React from "react";
import { LoginButton } from "../login-button";

export const LoginModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ open, onClose, onSuccess }) => {
  if (!open) return null;

  const handleSuccess = () => {
    onClose();
    onSuccess?.();
    // Optional: soft refresh to update UI state that depends on session
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-white font-semibold">Log in</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition"
            aria-label="Close login modal"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-slate-300 text-sm">
            Log in with Twitch to access subscriber features like submitting
            songs.
          </p>

          <div className="pt-2">
            <LoginButton onAuth={handleSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
};
