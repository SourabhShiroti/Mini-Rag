const { OpenAI } = require("openai");
const Pinecone = require("pinecone-client").Pinecone;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const pine = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENV
});
const index = pine.Index(process.env.PINECONE_INDEX);

async function chunkText(text) {
  const tokens = text.split(" ");
  const chunks = [];
  let i = 0;
  while (i < tokens.length) {
    const chunk = tokens.slice(i, i + 1000).join(" ");
    chunks.push(chunk);
    i += 900; // 10% overlap
  }
  return chunks;
}

async function ingestDocs(text) {
  const chunks = await chunkText(text);
  const vectors = [];

  for (let i = 0; i < chunks.length; i++) {
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks[i]
    });
    vectors.push({
      id: `doc_${Date.now()}_${i}`,
      values: emb.data[0].embedding,
      metadata: {
        text: chunks[i],
        section: i
      }
    });
  }
  await index.upsert({ vectors });
  return vectors.length;
}

module.exports = { ingestDocs };
