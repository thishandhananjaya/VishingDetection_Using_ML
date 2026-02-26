import os
import uuid
import secrets
from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
from inference import ScamInference
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)
CORS(app)

# --- CONFIG & INITIALIZATION ---
# Using a fixed admin user for cybersecurity demo
# In a real app, this would be in a database
ADMIN_USER = {
    "email": "admin@vishing.com",
    "password": generate_password_hash("admin123"), # Secure hashing
    "name": "Supervisory Admin"
}

# In-memory stores
history = []

# Initialize ML model
# Found required files in the directory
detector = ScamInference(
    model_path="best_model.pt",
    vocab_path="vocab.json",
    labels_path="labels.json",
    scaler_path="scaler.json"
)
model = whisper.load_model("base")

# --- API ENDPOINTS ---

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ready", "model": "loaded" if detector else "loading"})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    if not data:
        return jsonify({"error": "Missing request body"}), 400
    
    email = data.get('email', '').strip().lower()
    password = data.get('password')
    
    print(f"Login attempt for: {email}")

    if email == ADMIN_USER["email"].lower() and check_password_hash(ADMIN_USER["password"], password):
        print("Login successful")
        return jsonify({
            "message": "Authentication successful",
            "user": {
                "name": ADMIN_USER["name"],
                "email": ADMIN_USER["email"]
            },
            "token": str(uuid.uuid4()) # Mock token
        })
    
    print("Login failed: Invalid credentials")
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/analyze', methods=['POST'])
def analyze_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(file.filename)
    temp_path = os.path.join("uploads", filename)
    os.makedirs("uploads", exist_ok=True)
    
    try:
        file.save(temp_path)
        print(f"Transcribing file: {temp_path}")
        # Use fp16=False for CPU stability
        result = model.transcribe(temp_path, fp16=False)
        text = result["text"]
        print(f"Transcription complete: {text[:50]}...")
        
        prediction = detector.predict(text)

        res = {
            "id": str(uuid.uuid4()),
            "filename": file.filename,
            "status": "Scam" if str(prediction["prediction"]).lower() in ["1", "scam"] else "Safe",
            "risk": prediction["confidence"],
            "transcript": text,
            "keywords": prediction["keywords"],
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        history.append(res)
        print(f"Analysis successful for {file.filename}")
        return jsonify(res)
    except Exception as e:
        error_msg = str(e)
        print(f"Analysis ERROR: {error_msg}")
        return jsonify({"error": f"Analysis failed: {error_msg}"}), 500
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

@app.route('/api/analyze_folder', methods=['POST'])
def analyze_folder_path():
    data = request.json
    target_dir = data.get("path")
    if not target_dir or not os.path.isdir(target_dir):
        return jsonify({"error": "Invalid directory path"}), 400

    results = []
    audio_extensions = (".wav", ".mp3", ".m4a", ".flac")
    
    for filename in os.listdir(target_dir):
        if filename.lower().endswith(audio_extensions):
            file_path = os.path.join(target_dir, filename)
            try:
                result = model.transcribe(file_path, fp16=False)
                text = result["text"]
                prediction = detector.predict(text)

                res = {
                    "id": str(uuid.uuid4()),
                    "filename": filename,
                    "status": "Scam" if prediction["prediction"].lower() in ["1", "scam"] else "Safe",
                    "risk": prediction["confidence"],
                    "transcript": text,
                    "keywords": prediction["keywords"],
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
                history.append(res)
                results.append(res)
            except Exception as e:
                print(f"Failed to process {filename}: {e}")

    return jsonify({"processed": len(results), "results": results})

@app.route('/api/calls', methods=['GET'])
def get_calls():
    # Advanced Filtering Logic
    filtered = history.copy()
    
    # Filter by Status
    status_filter = request.args.get('status')
    if status_filter:
        filtered = [c for c in filtered if c['status'].lower() == status_filter.lower()]
        
    # Filter by Date Range (YYYY-MM-DD)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if start_date or end_date:
        try:
            temp_filtered = []
            for c in filtered:
                call_date = datetime.strptime(c['timestamp'], "%Y-%m-%d %H:%M:%S").date()
                keep = True
                if start_date and call_date < datetime.strptime(start_date, "%Y-%m-%d").date():
                    keep = False
                if end_date and call_date > datetime.strptime(end_date, "%Y-%m-%d").date():
                    keep = False
                if keep:
                    temp_filtered.append(c)
            filtered = temp_filtered
        except Exception as e:
            print(f"Filter error: {e}")

    # Sort by Timestamp (Latest first)
    filtered.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return jsonify(filtered)

@app.route('/api/calls/<call_id>', methods=['GET'])
def get_call_by_id(call_id):
    call = next((c for c in history if c["id"] == call_id), None)
    if not call:
        return jsonify({"error": "Call not found"}), 404
    return jsonify(call)

@app.route('/api/calls/<call_id>/resolve', methods=['PUT'])
def resolve_call(call_id):
    call = next((c for c in history if c["id"] == call_id), None)
    if not call:
        return jsonify({"error": "Call not found"}), 404
    
    call['status'] = 'Resolved'
    return jsonify({"message": "Call marked as resolved", "call": call})

@app.route('/api/summarize/<call_id>', methods=['POST'])
def summarize_call(call_id):
    call = next((c for c in history if c["id"] == call_id), None)
    if not call:
        return jsonify({"error": "Call not found"}), 404

    keywords = call.get("keywords", [])
    status = call.get("status", "Safe")

    if status == "Scam":
        summary = f"🚨 **Security Analysis**: Flagged as **SCAM**. Key triggers: {', '.join(keywords)}. High risk detected."
    else:
        summary = "✅ **Safety Check**: Conversation appears **SAFE**. No malicious patterns detected."

    return jsonify({"summary": summary})

if __name__ == '__main__':
    app.run(port=5000, debug=True, use_reloader=False)
