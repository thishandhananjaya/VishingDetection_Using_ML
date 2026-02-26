import json

INPUT_FILE = "C:\\Users\\DELL\\Desktop\\archive\\normal_transcript.json"
OUTPUT_FILE = "C:\\Users\\DELL\\Desktop\\archive\\n_labeled.json"

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

labeled = []

for item in data:
    labeled.append({
        "text": item["transcript"],
        "label": 0   # NORMAL
    })

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(labeled, f, indent=2, ensure_ascii=False)

print("✅ Normal transcripts labeled and saved as:", OUTPUT_FILE)
