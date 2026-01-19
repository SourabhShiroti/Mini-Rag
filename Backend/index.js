require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ingestDocs } = require("./ingest");
const { answerQuery } = require("./rag");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/ingest", async (req, res) => {
  const { text } = req.body;
  const id = await ingestDocs(text);
  res.json({ status: "ok", id });
});

app.post("/query", async (req, res) => {
  const { q } = req.body;
  const result = await answerQuery(q);
  res.json(result);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log("Running on", port));
