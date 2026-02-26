import whisper
import os

def test_whisper():
    model = whisper.load_model("base")
    audio_path = r"c:\Users\pinkg\OneDrive\Desktop\vishing\vishing-frontend\vishingbackend\audiodataset\fraud\conversation_0.wav"
    
    if not os.path.exists(audio_path):
        print(f"File not found: {audio_path}")
        return

    try:
        print(f"Transcribing: {audio_path}")
        result = model.transcribe(audio_path, fp16=False)
        print("Transcription:")
        print(result["text"])
    except Exception as e:
        print(f"Whisper Error: {e}")

if __name__ == "__main__":
    test_whisper()
