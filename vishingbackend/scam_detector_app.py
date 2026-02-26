import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import threading
import pyaudio
import wave
import whisper
from gradio_client import Client
from PIL import Image, ImageTk
import pytesseract

# ===============================
# MAIN APPLICATION
# ===============================
class ScamDetectorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Voice & Image Scam Detector")
        self.root.geometry("900x700")
        self.root.resizable(False, False)

        self.is_recording = False
        self.audio_frames = []
        self.audio_file = "temp_recording.wav"

        self.whisper_model = None
        self.hf_client = None

        # Audio settings
        self.CHUNK = 1024
        self.FORMAT = pyaudio.paInt16
        self.CHANNELS = 1
        self.RATE = 16000

        self.setup_ui()
        self.load_models()

    # ---------------- UI ----------------
    def setup_ui(self):
        bg = "#f0f0f0"
        self.root.configure(bg=bg)

        title = tk.Label(
            self.root,
            text="🎙️📸 Voice & Image Scam Detector",
            font=("Arial", 22, "bold"),
            bg="#2196F3",
            fg="white",
            height=2
        )
        title.pack(fill=tk.X)

        self.tabs = ttk.Notebook(self.root)
        self.audio_tab = tk.Frame(self.tabs, bg=bg)
        self.image_tab = tk.Frame(self.tabs, bg=bg)

        self.tabs.add(self.audio_tab, text="🎙️ Voice Analysis")
        self.tabs.add(self.image_tab, text="📸 Image Analysis")
        self.tabs.pack(fill=tk.BOTH, expand=True)

        self.setup_audio_tab()
        self.setup_image_tab()

    # ---------------- AUDIO TAB ----------------
    def setup_audio_tab(self):
        bg = "#f0f0f0"

        btn_frame = tk.Frame(self.audio_tab, bg=bg)
        btn_frame.pack(pady=10)

        self.record_btn = tk.Button(
            btn_frame, text="🔴 Start Recording",
            command=self.toggle_recording,
            bg="#f44336", fg="white",
            font=("Arial", 12, "bold"),
            width=18, height=2
        )
        self.record_btn.grid(row=0, column=0, padx=10)

        tk.Button(
            btn_frame, text="📁 Upload Audio",
            command=self.upload_audio,
            bg="#2196F3", fg="white",
            font=("Arial", 12, "bold"),
            width=18, height=2
        ).grid(row=0, column=1, padx=10)

        self.audio_progress = ttk.Progressbar(self.audio_tab, mode="indeterminate")
        self.audio_progress.pack(pady=5)

        self.transcript = tk.Text(self.audio_tab, height=6)
        self.transcript.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        self.audio_result = tk.Label(
            self.audio_tab, text="", height=2,
            font=("Arial", 18, "bold"), relief=tk.RAISED
        )
        self.audio_result.pack(fill=tk.X, padx=10, pady=10)

    # ---------------- IMAGE TAB ----------------
    def setup_image_tab(self):
        bg = "#f0f0f0"

        tk.Button(
            self.image_tab, text="🖼️ Upload Image",
            command=self.upload_image,
            bg="#9C27B0", fg="white",
            font=("Arial", 12, "bold"),
            width=20, height=2
        ).pack(pady=10)

        self.image_progress = ttk.Progressbar(self.image_tab, mode="indeterminate")
        self.image_progress.pack(pady=5)

        self.image_label = tk.Label(self.image_tab, text="No Image", bg="white")
        self.image_label.pack(pady=5)

        self.ocr_text = tk.Text(self.image_tab, height=6)
        self.ocr_text.pack(fill=tk.BOTH, expand=True, padx=10)

        self.image_result = tk.Label(
            self.image_tab, text="", height=2,
            font=("Arial", 18, "bold"), relief=tk.RAISED
        )
        self.image_result.pack(fill=tk.X, padx=10, pady=10)

    # ---------------- LOAD MODELS ----------------
    def load_models(self):
        def load():
            try:
                self.whisper_model = whisper.load_model("base")
                self.hf_client = Client("Nadun102/new_scam")
            except Exception as e:
                messagebox.showerror("Error", str(e))

        threading.Thread(target=load, daemon=True).start()

    # ---------------- AUDIO ----------------
    def toggle_recording(self):
        if not self.is_recording:
            self.start_recording()
        else:
            self.is_recording = False

    def start_recording(self):
        self.is_recording = True
        self.audio_frames = []
        self.record_btn.config(text="⏹ Stop", bg="#ff9800")

        def record():
            p = pyaudio.PyAudio()
            stream = p.open(
                format=self.FORMAT,
                channels=self.CHANNELS,
                rate=self.RATE,
                input=True,
                frames_per_buffer=self.CHUNK
            )

            while self.is_recording:
                self.audio_frames.append(stream.read(self.CHUNK))

            stream.close()
            p.terminate()

            with wave.open(self.audio_file, "wb") as wf:
                wf.setnchannels(self.CHANNELS)
                wf.setsampwidth(p.get_sample_size(self.FORMAT))
                wf.setframerate(self.RATE)
                wf.writeframes(b"".join(self.audio_frames))

            self.process_audio(self.audio_file)

        threading.Thread(target=record, daemon=True).start()

    def upload_audio(self):
        path = filedialog.askopenfilename()
        if path:
            self.process_audio(path)

    def process_audio(self, path):
        def run():
            self.audio_progress.start()
            result = self.whisper_model.transcribe(path)
            text = result["text"].strip()

            self.transcript.delete(1.0, tk.END)
            self.transcript.insert(tk.END, text)

            prediction = self.hf_client.predict(text=text, api_name="/predict")
            self.show_result(prediction, self.audio_result)

            self.audio_progress.stop()

        threading.Thread(target=run, daemon=True).start()

    # ---------------- IMAGE ----------------
    def upload_image(self):
        path = filedialog.askopenfilename()
        if path:
            self.process_image(path)

    def process_image(self, path):
        def run():
            self.image_progress.start()

            img = Image.open(path)
            img.thumbnail((400, 250))
            photo = ImageTk.PhotoImage(img)
            self.image_label.config(image=photo)
            self.image_label.image = photo

            text = pytesseract.image_to_string(img).strip()
            self.ocr_text.delete(1.0, tk.END)
            self.ocr_text.insert(tk.END, text)

            prediction = self.hf_client.predict(text=text, api_name="/predict")
            self.show_result(prediction, self.image_result)

            self.image_progress.stop()

        threading.Thread(target=run, daemon=True).start()

    # ---------------- ✅ FIXED RESULT HANDLER ----------------
    def show_result(self, prediction, label_widget):
        print("HF RAW OUTPUT:", prediction)

        label = ""
        confidence = ""

        if isinstance(prediction, list) and len(prediction) > 0:
            item = prediction[0]
            if isinstance(item, dict):
                label = str(item.get("Prediction", item.get("label", "")))
                confidence = str(item.get("Confidence", ""))
            else:
                label = str(item)

        elif isinstance(prediction, dict):
            label = str(prediction.get("Prediction", prediction.get("label", "")))
            confidence = str(prediction.get("Confidence", ""))

        elif isinstance(prediction, tuple):
            label = str(prediction[0])
            if len(prediction) > 1:
                confidence = str(prediction[1])

        else:
            label = str(prediction)

        label_clean = label.strip().lower()

        scam_labels = {
            "1", "scam", "spam", "fraud", "phishing", "malicious", "true"
        }

        if label_clean in scam_labels:
            label_widget.config(
                text=f"⚠️ SCAM DETECTED {confidence}",
                bg="#f44336",
                fg="white"
            )
        else:
            label_widget.config(
                text=f"✓ NORMAL MESSAGE {confidence}",
                bg="#4CAF50",
                fg="white"
            )

# ---------------- MAIN ----------------
def main():
    root = tk.Tk()
    ScamDetectorApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
