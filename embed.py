import json
import os
from openai import OpenAI
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

openai = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

def get_embedding(text: str) -> list[float]:
    response = openai.embeddings.create(input=text, model="text-embedding-ada-002")
    return response.data[0].embedding

def main():
    with open("data.json", "r", encoding="utf-8") as f:
        records = json.load(f)

    for record in records:
        # Combine title + content for richer embedding
        text = f"{record.get('title', '')} {record.get('content', '')}"
        embedding = get_embedding(text)

        supabase.table("documents").insert({
            "source": record.get("source"),
            "type": record.get("type"),
            "title": record.get("title"),
            "content": record.get("content"),
            "metadata": {k: v for k, v in record.items() if k not in ("source", "type", "title", "content")},
            "embedding": embedding
        }).execute()

        print(f"Inserted: {record.get('title')}")

if __name__ == "__main__":
    main()
