import os
import requests

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = "google/gemma-3-12b-it:free"
URL = "https://openrouter.ai/api/v1/chat/completions"


def call_llm(prompt: str) -> str:
    r = requests.post(
        URL,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 800,
            "temperature": 0.3,
        },
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


if __name__ == "__main__":
    question = input("\nEnter research question:\n> ")

    prompt = f"""
Answer the following question like a short research note.

Structure your response as:
1. Definition / Background
2. Key mechanisms or ideas
3. Limitations or open questions
4. Short conclusion

Be concise. No philosophy fluff.

Question:
{question}
"""

    print("\n🧠 Thinking...\n")
    answer = call_llm(prompt)

    print("===== FINAL ANSWER =====\n")
    print(answer)
