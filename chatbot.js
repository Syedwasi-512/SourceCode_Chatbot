import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const deepseek = new OpenAI({ 
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com"
});
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

    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
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

CRITICAL RULES:
- RESPONSE LENGTH: Keep answers very SHORT and precise (maximum 2-3 sentences). Avoid long paragraphs.
- FORMATTING: Use bullet points if listing more than 2 items to keep it readable.
- ONLY use the provided Context (from data.json) to answer.
- If the user's question is NOT related to Source Code Academy or the information is not in the Context, you MUST politely say: "I am sorry, but I only have information regarding Source Code Academy courses and services. I cannot assist with other topics."
- Do NOT answer questions about actors, general IT concepts not mentioned in the data, politics, or any other irrelevant topics.
- DETECT the language of the user's question and ALWAYS respond in that same language (e.g., if asked in English, reply in English; if asked in Roman Urdu, reply in Roman Urdu).
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
    return reply;
  } catch (err) {
    console.error("Chat error:", err);
    return "Something went wrong.";
  }
}
