import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

async function embed(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const res = await model.embedContent(text);
  return res.embedding.values;
}

async function searchSimilarChunks(queryVector) {
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryVector,
    match_threshold: 0.45,
    match_count: 5,
  });
  if (error) {
    console.error("Search error:", error.message);
    return [];
  }
  return data;
}

const sessions = new Map();

export async function chat(userMessage, sessionId = "default") {
  try {
    const queryVector = await embed(userMessage);
    const matches = await searchSimilarChunks(queryVector);
    const context = matches.map((m) => m.content).join("\n");

    if (!sessions.has(sessionId)) sessions.set(sessionId, []);
    const history = sessions.get(sessionId);

    history.push({ role: "user", content: userMessage });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are the official assistant of Source Code Academy.

LANGUAGE RULES:
- The user might speak in English, Roman Urdu (e.g., "fees kya hai"), or Urdu (e.g., "فیس کیا ہے").
- Always respond in the SAME language/script used by the user.
- If the user uses Roman Urdu, you MUST reply in Roman Urdu.

ACCURACY & SECURITY RULES:
- ONLY use the provided Context to answer.
- If the information is not in the context, politely say you don't have that specific detail and suggest they contact the office.
- NEVER invent courses (like Robotics or Java) if they aren't in the context.
- If pricing is in USD, convert to PKR (Approx 1 USD = 280 PKR) but mention it's an estimate.
- Avoid discussing personal topics or anything outside the Academy's scope.
Rules:
- Use the provided context to answer as helpfully as possible
-if pricing are asked, always tell price in pkr after converting price from usd to pkr using the current exchange rate.
-pricing should be extremly accurate and up to date, if you are not sure about the price, give a range of price in pkr.
- If the answer is partially in context, give the best possible answer
- Only say "I don't know" if the topic is completely unrelated to the academy
- Be friendly, clear, and conversational

Context:
${context}`,
        },
        ...history,
        {role: "user", content: userMessage }
      ],
    });

    const reply = completion.choices[0].message.content;
    history.push({ role: "assistant", content: reply });
    history.push({ role: "user", content: userMessage });
    return reply;
  } catch (err) {
    console.error("Chat error:", err);
    return "Something went wrong.";
  }
}
