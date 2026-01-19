import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [resp, setResp] = useState(null);

  const ingest = async () => {
    await axios.post("/api/ingest", { text });
    alert("Done");
  };

  const runQ = async () => {
    const r = await axios.post("/api/query", { q: query });
    setResp(r.data);
  };

  return (
    <div>
      <textarea
        placeholder="Paste text"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button onClick={ingest}>Ingest</button>

      <input
        placeholder="Ask a question"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <button onClick={runQ}>Ask</button>

      {resp && (
        <div>
          <h3>Answer</h3>
          <p>{resp.answer}</p>
          <h4>Sources</h4>
          <p>{JSON.stringify(resp.sources)}</p>
        </div>
      )}
    </div>
  );
}
