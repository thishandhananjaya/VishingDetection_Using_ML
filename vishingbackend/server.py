import os
import uuid
import whisper
from flask import Flask, request, jsonify
from flask_cors import CORS
from inference import ScamInference

app = Flask(__name__)
CORS(app)

# --- Configuration ---
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- Load Models ---
print("Loading Whisper model...")
whisper_model = whisper.load_model("base")

print("Loading Scam Detector model...")
detector = ScamInference(
    model_path="best_model.pt",
    vocab_path="vocab.json",
    labels_path="labels.json",
    scaler_path="scaler.json"
)

# In-memory storage for history (replace with DB if needed)
history = []

@app.route('/api/analyze', methods=['POST'])
def analyze_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    try:
        # Transcribe
        result = whisper_model.transcribe(filepath)
        text = result["text"].strip()

        # Predict
        prediction = detector.predict(text)
        
        res = {
            "id": str(uuid.uuid4()),
            "filename": file.filename,
            "status": "Scam" if prediction["prediction"].lower() == "1" or prediction["prediction"].lower() == "scam" else "Safe",
            "risk": prediction["confidence"],
            "transcript": text,
            "timestamp": "Just now"
        }
        
        history.append(res)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

@app.route('/api/analyze_folder', methods=['POST'])
def analyze_folder():
    data = request.json
    folder_path = data.get('path')
    
    if not folder_path or not os.path.isdir(folder_path):
        return jsonify({"error": "Invalid directory path"}), 400

    results = []
    audio_extensions = ('.wav', '.mp3', '.m4a', '.flac')
    
    for filename in os.listdir(folder_path):
        if filename.lower().endswith(audio_extensions):
            filepath = os.path.join(folder_path, filename)
            try:
                # Transcribe
                transcript_res = whisper_model.transcribe(filepath)
                text = transcript_res["text"].strip()

                # Predict
                prediction = detector.predict(text)
                
                res = {
                    "id": str(uuid.uuid4()),
                    "filename": filename,
                    "status": "Scam" if prediction["prediction"].lower() == "1" or prediction["prediction"].lower() == "scam" else "Safe",
                    "risk": prediction["confidence"],
                    "transcript": text,
                    "timestamp": "Batch Processed"
                }
                results.append(res)
                history.append(res)
            except Exception as e:
                print(f"Error processing {filename}: {e}")

    return jsonify(results)

@app.route('/api/calls', methods=['GET'])
def get_calls():
    return jsonify(history)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
