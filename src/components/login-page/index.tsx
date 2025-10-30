type Props = {
  onLoginSuccess: (sessionId: string) => void;
};

export const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
  return (
    <div className="flex items-center justify-center h-full flex-col gap-2">
      <h2 className="text-4xl">
        So you said something stupid in Twitch chat...
      </h2>
      <p className="text-xl pb-4">Log in with Twitch to submit your apology.</p>
      <button
        onClick={() => {
          // Simulate a successful login and return a mock session ID
          const mockSessionId = "mock-session-id-12345";
          localStorage.setItem("august-session-id", mockSessionId);
          onLoginSuccess(mockSessionId);
        }}
        className="bg-[#8956FB] text-white px-4 py-2 rounded-md hover:bg-[#6f40d8] transition cursor-pointer"
      >
        Log in with Twitch
      </button>
    </div>
  );
};
