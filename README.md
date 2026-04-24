# RAG Chatbot

A Retrieval-Augmented Generation (RAG) chatbot for **Source Code Academy** built with Node.js, Groq (Kimi K2), Google Gemini embeddings, and Supabase vector search. Includes an embeddable widget for any website.

## Stack

- **LLM**: Groq — `moonshotai/kimi-k2-instruct`
- **Embeddings**: Google Gemini — `gemini-embedding-001`
- **Vector DB**: Supabase (`match_documents` RPC)
- **Server**: Express.js
- **Widget**: Vanilla JS (drop-in embed)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the root:

```env
GEMINI_API_KEY=<your_gemini_api_key>
GROQ_API_KEY=<your_groq_api_key>
SUPABASE_URL=<your_supabase_url>
SUPABASE_KEY=<your_supabase_anon_key>
```

### 3. Prepare knowledge base

Add your data to `data.json` as an array of objects with a `content` field:

```json
[
  { "content": "Source Code Academy offers Python, Web Dev, and AI courses." }
]
```

### 4. Ingest data into Supabase

```bash
npm run ingest
```

> This embeds each chunk via Gemini and stores it in the `documents` table.

### 5. Start the server

```bash
npm start
```

Deploy the server to your hosting provider. The API will be accessible at your organization's domain, e.g., `https://chatbot.yourorganization.com`.

## Embedding the Widget

Add this snippet to any webpage:

```html
<script>
  window.__CHATBOT_API_URL = 'https://chatbot.yourorganization.com';
</script>
<script src="https://chatbot.yourorganization.com/widget.js"></script>
```

The chat bubble will appear in the bottom-right corner.

## API

### `POST /chat`

```json
// Request
{ "message": "What courses do you offer?", "sessionId": "abc123" }

// Response
{ "reply": "We offer Python, Web Dev, and AI courses." }
```

## Supabase Setup

Your `documents` table needs a `match_documents` RPC function for vector similarity search. Example:

```sql
create or replace function match_documents(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table(content text, similarity float)
language sql stable as $$
  select content, 1 - (embedding <=> query_embedding) as similarity
  from documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
```

## Deployment

The server is a standard Express.js app. Any Node.js-compatible host works:

- **Railway / Render / Fly.io** — connect your repo, set the env vars, and deploy. The app listens on `process.env.PORT` automatically.
- **VPS (EC2, DigitalOcean, etc.)** — clone the repo, set env vars, then run with a process manager:
  ```bash
  npm install -g pm2
  pm2 start server.js --name chatbot
  ```
- **Docker** — add a simple `Dockerfile` with `node:20-alpine`, copy files, run `npm install`, expose the port, and set `CMD ["node", "server.js"]`.

Make sure all four env vars (`GEMINI_API_KEY`, `GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`) are set in your hosting environment before starting.

## Alternative Ingestion (Python)

`embed.py` uses OpenAI embeddings instead of Gemini and supports richer metadata (`source`, `type`, `title`).

```bash
pip install openai supabase python-dotenv
python embed.py
```

Requires `OPENAI_API_KEY` in `.env`.
