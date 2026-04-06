import os
import base64
import hashlib
import requests
from dotenv import load_dotenv

# ================== CONFIG ==================

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
assert GROQ_API_KEY, "GROQ_API_KEY missing"

MODEL = os.getenv(
    "GROQ_MODEL",
    "nvidia/nemotron-nano-12b-v2-vl:free"
)

API_URL = "https://api.groq.com/openai/v1/chat/completions"

HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json",
}

ASSETS = {
    "img1": ("assets/img1.jpeg", "image/jpeg"),
    "img2": ("assets/img2.jpeg", "image/jpeg"),
    "pdf1": ("assets/doc1.pdf", "application/pdf"),
    "pdf2": ("assets/doc2.pdf", "application/pdf"),
    "audio1": ("assets/audio1.mp3", "audio/mpeg"),
    "video1": ("assets/vid1.mp4", "video/mp4"),
}

GENERIC_PATTERNS = [
    "i cannot access",
    "i'm unable to",
    "as an ai",
    "cannot view",
    "no information provided",
    "cannot determine",
    "based on the prompt alone",
]

# ================== HELPERS ==================

def read_bytes(path):
    with open(path, "rb") as f:
        return f.read()


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def encode(path):
    return base64.b64encode(read_bytes(path)).decode()


def image_part(path, mime):
    return {
        "type": "image_url",
        "image_url": {
            "url": f"data:{mime};base64,{encode(path)}"
        }
    }


def file_part(path, mime):
    return {
        "type": "input_file",
        "input_file": {
            "mime_type": mime,
            "data": encode(path)
        }
    }


def is_generic(text: str) -> bool:
    text = text.lower()
    return any(p in text for p in GENERIC_PATTERNS)


def grounded(text: str, marker: str) -> bool:
    return marker.lower() in text.lower()


def run_test(name, parts, marker):
    payload = {
        "model": MODEL,
        "messages": [{
            "role": "user",
            "content": parts
        }],
        "temperature": 0,
        "max_tokens": 300,
    }

    try:
        r = requests.post(API_URL, headers=HEADERS, json=payload, timeout=120)
    except Exception as e:
        return "FAIL", f"request error: {e}"

    if r.status_code != 200:
        return "FAIL", f"http {r.status_code}"

    try:
        output = r.json()["choices"][0]["message"]["content"]
    except Exception:
        return "FAIL", "bad response format"

    if not output or len(output.strip()) < 30:
        return "FAIL", "empty or trivial output"

    if is_generic(output):
        return "FAIL", "generic / boilerplate response"

    if not grounded(output, marker):
        return "FAIL", "no hash marker grounding"

    return "PASS", None


# ================== TEST MATRIX ==================

def build_test(name, asset_keys, prompt):
    blobs = []
    combined_hash = hashlib.sha256()

    for k in asset_keys:
        path, mime = ASSETS[k]
        data = read_bytes(path)
        combined_hash.update(data)

        if mime.startswith("image"):
            blobs.append(image_part(path, mime))
        else:
            blobs.append(file_part(path, mime))

    marker = combined_hash.hexdigest()[:12]

    text = (
        f"{prompt}\n\n"
        f"IMPORTANT: Somewhere in your answer, explicitly include this marker:\n"
        f"<<{marker}>>\n"
        f"If you cannot read the file, say so clearly."
    )

    return name, [
        {"type": "text", "text": text},
        *blobs
    ], marker


TESTS = [
    build_test("image_only", ["img1"], "Describe specific visual details in this image."),
    build_test("image_plus_text", ["img1"], "Explain what is happening in this image."),
    build_test("multi_image", ["img1", "img2"], "Compare concrete visual differences."),
    build_test("pdf_single", ["pdf1"], "Summarize specific facts from this document."),
    build_test("pdf_multi", ["pdf1", "pdf2"], "Contrast key points between documents."),
    build_test("image_pdf_mix", ["img1", "pdf1"], "Relate image content to document content."),
    build_test("audio", ["audio1"], "Describe concrete sounds or speech."),
    build_test("video", ["video1"], "Summarize specific events."),
]

# ================== RUN ==================

def main():
    print(f"\n🧪 Grounding Probe — Model: {MODEL}\n")

    passed = 0

    for name, parts, marker in TESTS:
        try:
            status, reason = run_test(name, parts, marker)
        except FileNotFoundError:
            print(f"{name:25} ⏭️ SKIP (missing asset)")
            continue

        if status == "PASS":
            print(f"{name:25} ✅ PASS (grounded)")
            passed += 1
        else:
            print(f"{name:25} ❌ FAIL → {reason}")

    print(f"\nRESULT: {passed}/{len(TESTS)} grounded tests passed\n")


if __name__ == "__main__":
    main()
