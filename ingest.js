import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function embed(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const res = await model.embedContent(text);
  return res.embedding.values;
}

const data = JSON.parse(readFileSync("./data.json", "utf8"));
const knowledgeBase = data.map(item => item.content);

async function uploadKnowledgeBase() {
  console.log("Starting ingestion...");
  for (const chunk of knowledgeBase) {
    try {
      console.log("Processing:", chunk);
      const embedding = await embed(chunk);
      const { error } = await supabase.from("documents").insert({ content: chunk, embedding });
      if (error) console.error("DB insert error:", error.message);
      else console.log("Inserted successfully");
    } catch (err) {
      console.error("Error processing chunk:", err.message);
    }
  }
  console.log("Ingestion complete.");
}

uploadKnowledgeBase();
