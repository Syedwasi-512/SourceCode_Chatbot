import express from "express";
import { chat } from "./chatbot.js";
import { readFileSync } from "fs";
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get("/widget.js", (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(readFileSync("./widget.js", "utf8"));
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/", (req, res) => {
  res.send(readFileSync(path.join(__dirname, "index.html", "utf8")));
});

app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });
  const reply = await chat(message, sessionId || "default");
  res.json({ reply });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
