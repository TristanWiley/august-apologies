import { useCallback, useState } from "react";
import {
  BtnBold,
  BtnClearFormatting,
  BtnItalic,
  BtnLink,
  BtnNumberedList,
  BtnStrikeThrough,
  BtnUnderline,
  Editor,
  EditorProvider,
  Toolbar,
} from "react-simple-wysiwyg";
import { Nav } from "../nav";

export const ApologySubmission: React.FC = () => {
  const [apology, setApology] = useState(
    localStorage.getItem("august-temp-apology") || ""
  );
  const [subject, setSubject] = useState(
    localStorage.getItem("august-temp-subject") || ""
  );
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(async () => {
    const yay = confirm(
      "Are you sure you want to submit? This can't be undone."
    );

    const sessionId = localStorage.getItem("august-session-id");

    if (!yay || !sessionId) {
      return;
    }

    const response = await fetch("/api/apologies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apology, sessionId, subject }),
    });

    if (!response.ok) {
      alert("Failed to submit apology");
      return;
    }

    setSubmitted(true);
    localStorage.removeItem("august-session-id");
    localStorage.removeItem("august-temp-apology");
    localStorage.removeItem("august-temp-subject");
  }, [apology, subject]);

  if (submitted) {
    return (
      <EditorProvider>
        <div className="flex items-center justify-center h-full flex-col gap-4 px-4">
          <Nav />
          <div className="w-full max-w-3xl flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold">Apology Submitted</h1>
            <p className="text-center text-xl">
              We hope you learn your lesson.
            </p>
          </div>
        </div>
      </EditorProvider>
    );
  }

  return (
    <EditorProvider>
      <div className="flex items-center justify-center h-full w-full flex-col gap-4 px-4">
        <Nav />

        <div className="w-full max-w-3xl flex flex-col items-stretch gap-4">
          <h1 className="text-2xl font-bold">Apology Submission</h1>
          <p className="text-center text-xl">
            This is where you apologize for your mistakes. Subject is required.
          </p>

          <div className="w-full">
            <input
              placeholder="Subject"
              className="w-full mb-2 p-2 border"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <Editor
              containerProps={{
                style: {
                  resize: "vertical",
                  height: "20rem",
                  fontFamily: "Times New Roman, serif",
                },
              }}
              value={apology}
              onChange={(e) => setApology(e.target.value)}
            >
              <Toolbar>
                <BtnBold />
                <BtnItalic />
                <BtnClearFormatting />
                <BtnItalic />
                <BtnStrikeThrough />
                <BtnLink />
                <BtnNumberedList />
                <BtnUnderline />
              </Toolbar>
            </Editor>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 px-4 cursor-pointer"
              onClick={handleSubmit}
            >
              Submit Apology
            </button>
          </div>
        </div>
      </div>
    </EditorProvider>
  );
};
