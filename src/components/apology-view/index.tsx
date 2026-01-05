import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Editor, EditorProvider } from "react-simple-wysiwyg";

export const ApologyView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [apology, setApology] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);

  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (!id) return;

    const fetchApology = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/apologies/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch apology");
        }
        const data = await response.json();
        setUsername(data.username);
        setApology(data.apology);
        setSubject(data.subject);
      } catch (error) {
        console.error("Error fetching apology:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApology();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xl">Loading...</p>
        <img
          src="/augRiot.webp"
          alt="Loading"
          className="w-8 h-8 ml-4 animate-spin"
        />
      </div>
    );
  }

  if (!username || !apology || !subject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xl">Apology not found.</p>
      </div>
    );
  }

  return (
    <EditorProvider>
      <div className="flex items-center justify-center h-full w-full flex-col gap-2">
        <h1 className="text-2xl font-bold">
          Apology Submission from {username}
        </h1>

        <div className="w-6xl">
          <input
            placeholder="Subject"
            className="w-full mb-2 p-2 border"
            defaultValue={subject}
            disabled
          />
          <Editor
            containerProps={{
              style: {
                resize: "vertical",
                height: "20rem",
                fontFamily: "Times New Roman, serif",
              },
            }}
            defaultValue={apology}
            disabled={true}
          />
        </div>
      </div>
    </EditorProvider>
  );
};
