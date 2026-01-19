const { OpenAI } = require("openai");
const axios = require("axios");
const Pinecone = require("pinecone-client").Pinecone;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pine = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENV
});
const index = pine.Index(process.env.PINECONE_INDEX);

async function rerank(query, candidates) {
  const texts = candidates.map(c => c.metadata.text);
  const payload = {
    model: "rerank-cohere-model",
    query,
    texts
  };
  const resp = await axios.post(
    "https://api.cohere.ai/rerank",
    payload,
    { headers: { Authorization: `Bearer ${process.env.COHERE_API_KEY}` } }
  );
  const scores = resp.data.scores;
  return candidates
    .map((c, i) => ({ ...c, score: scores[i] }))
    .sort((a, b) => b.score - a.score);
}

async function answerQuery(q) {
  // embed query
  const emb = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: q
  });

  const pineResp = await index.query({
    vector: emb.data[0].embedding,
    topK: 8,
    includeMetadata: true
  });

  const reranked = await rerank(q, pineResp.matches);

  const contextText = reranked.slice(0, 3)
    .map((m, i) => `[${i+1}] ${m.metadata.text}`)
    .join("\n");

  const prompt = `
Answer with citations. If no answer, say “No info.”

Context:
${contextText}

Q: ${q}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  return {
    answer: completion.choices[0].message.content,
    sources: reranked.slice(0, 3).map((m, i) => i+1)
  };
}

module.exports = { answerQuery };
