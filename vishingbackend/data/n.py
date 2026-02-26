import torch

from faster_whisper import WhisperModel
import os
import json

# -------------------------
# Config
# -------------------------
AUDIO_FOLDER = "C:\\Users\\DELL\\Desktop\\archive\\audiodataset\\normal"
OUTPUT_FILE = "C:\\Users\\DELL\\Desktop\\archive\\audiodataset\\normal\\normal_transcript"
MODEL_SIZE = "base"  # tiny | base | small | medium | large-v2

device = "cuda" if torch.cuda.is_available() else "cpu"

# -------------------------
# Load Model
# -------------------------
model = WhisperModel(
    MODEL_SIZE,
    device=device,
    compute_type="float16" if device == "cuda" else "int8"
)

# -------------------------
# Transcribe Folder
# -------------------------
results = []

for file in os.listdir(AUDIO_FOLDER):
    if file.endswith((".wav", ".mp3", ".m4a", ".flac")):
        file_path = os.path.join(AUDIO_FOLDER, file)
        print(f"🎧 Transcribing: {file}")

        segments, info = model.transcribe(file_path)

        transcript = " ".join([seg.text for seg in segments])

        results.append({
            "file": file,
            "language": info.language,
            "transcript": transcript.strip()
        })

# -------------------------
# Save Output
# -------------------------
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\n✅ Transcription completed. Saved to {OUTPUT_FILE}")
