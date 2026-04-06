import os
import base64
import requests
from dotenv import load_dotenv

# ================== CONFIG ==================

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
assert OPENROUTER_API_KEY, "OPENROUTER_API_KEY missing"

MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-120b:free")
API_URL = "https://openrouter.ai/api/v1/chat/completions"

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost",
    "X-Title": "openrouter-multimodal-probe"
}

ASSETS = {
    "img1": "assets/img1.jpeg",
    "img2": "assets/img2.jpeg",
    "pdf1": "assets/doc1.pdf",
    "pdf2": "assets/doc2.pdf",
    "audio1": "assets/audio1.mp3",
    "video1": "assets/vid1.mp4",
    "video2": "assets/vid2.mp4",
}

# ================== HELPERS ==================

def encode(path: str) -> str:
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


def image_part(path):
    mime = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }.get(os.path.splitext(path)[1].lower(), "application/octet-stream")

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


def run_test(name, content):

    payload = {
        "model": MODEL,
        "messages": [{
            "role": "user",
            "content": content
        }]
    }

    try:
        r = requests.post(API_URL, headers=HEADERS, json=payload, timeout=120)
    except Exception as e:
        return "FAIL", f"request error: {e}"

    try:
        data = r.json()
    except Exception:
        return "FAIL", "non-json response"

    if r.status_code != 200:
        return "FAIL", data.get("error", {}).get("message", "http error")

    try:
        output = data["choices"][0]["message"]["content"]
        if not output:
            raise ValueError("empty output")
        return "PASS", None
    except Exception:
        return "FAIL", "no usable output"


# ================== TEST MATRIX ==================

TESTS = [
    ("image_only", [
        image_part(ASSETS["img1"])
    ]),

    ("image_plus_text", [
        {"type": "text", "text": "Describe this image."},
        image_part(ASSETS["img1"])
    ]),

    ("multiple_images_plus_text", [
        {"type": "text", "text": "Compare these images."},
        image_part(ASSETS["img1"]),
        image_part(ASSETS["img2"])
    ]),

    ("pdf_plus_text", [
        {"type": "text", "text": "Summarize this document."},
        file_part(ASSETS["pdf1"], "application/pdf")
    ]),

    ("multiple_pdfs_plus_text", [
        {"type": "text", "text": "Compare these documents."},
        file_part(ASSETS["pdf1"], "application/pdf"),
        file_part(ASSETS["pdf2"], "application/pdf")
    ]),

    ("images_pdfs_text", [
        {"type": "text", "text": "Relate the images to the documents."},
        image_part(ASSETS["img1"]),
        image_part(ASSETS["img2"]),
        file_part(ASSETS["pdf1"], "application/pdf"),
        file_part(ASSETS["pdf2"], "application/pdf")
    ]),

    ("audio_plus_text", [
        {"type": "text", "text": "Describe what you hear."},
        file_part(ASSETS["audio1"], "audio/mpeg")
    ]),

    ("video_plus_text", [
        {"type": "text", "text": "Summarize what happens in this video."},
        file_part(ASSETS["video1"], "video/mp4")
    ]),
]

# ================== RUN ==================

def main():
    print(f"\n🔍 Testing model: {MODEL}\n")

    passed = 0
    total = len(TESTS)

    for name, content in TESTS:
        try:
            status, reason = run_test(name, content)
        except FileNotFoundError as e:
            print(f"{name:30} ⏭️  SKIP (missing asset)")
            continue

        if status == "PASS":
            print(f"{name:30} ✅ PASS")
            passed += 1
        else:
            print(f"{name:30} ❌ FAIL" + (f" → {reason}" if reason else ""))

    print(f"\nRESULT: {passed}/{total} tests passed")


if __name__ == "__main__":
    main()
