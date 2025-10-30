export const ApologySubmission: React.FC = () => {
  return (
    <div>
      <h2>Apology Submission</h2>
      <form>
        <label>
          Apology Text:
          <textarea name="apologyText" rows={4} cols={50} />
        </label>
        <br />
        <button type="submit">Submit Apology</button>
      </form>
    </div>
  );
};
