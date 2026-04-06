import os
import sys
from dotenv import load_dotenv
from tavily import TavilyClient
from openai import OpenAI

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# --------------------------------------------------
# CLIENTS
# --------------------------------------------------

tavily = TavilyClient(api_key=TAVILY_API_KEY)

client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
)

MODEL = "nex-agi/deepseek-v3.1-nex-n1:free"

# --------------------------------------------------
# SEARCH
# --------------------------------------------------

def web_search(query: str, k: int = 5):
    res = tavily.search(
        query=query,
        max_results=k,
        include_answer=False,
        include_raw_content=False,
    )

    docs = []
    for r in res.get("results", []):
        docs.append(
            f"- {r['title']} ({r['url']}): {r['content']}"
        )
    return "\n".join(docs)

# --------------------------------------------------
# STREAMING AGENT
# --------------------------------------------------

def ask_with_search_stream(question: str):
    print("\n🔎 Searching web...")
    context = web_search(question)

    prompt = f"""
You are a web-enabled research assistant.

Use the following web results to answer the question accurately.
Do NOT hallucinate. Base answers strictly on the data.

Web results:
{context}

Question:
{question}

Answer:
"""

    print("\n🤖 Answer:\n")

    stream = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        stream=True,
        max_tokens=500,
        temperature=0.2,
    )

    full_answer = ""

    for chunk in stream:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            print(delta.content, end="", flush=True)
            full_answer += delta.content

    print("\n\n✅ Done.")
    return full_answer

# --------------------------------------------------
# MAIN
# --------------------------------------------------

if __name__ == "__main__":
    try:
        q = input("\nEnter question: ").strip()
        ask_with_search_stream(q)
    except KeyboardInterrupt:
        print("\n⛔ Interrupted")
