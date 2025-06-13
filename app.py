from flask import Flask, render_template, request, jsonify
from gradio_client import Client, handle_file
import os
import uuid
import subprocess
import time
import shutil

app = Flask(__name__)
client = Client("https://ai4bharat-indicf5.hf.space/")

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "static/outputs"
ALLOWED_LANGUAGES = ["kn", "hi", "ta", "te", "gu", "ml", "mr", "bn", "pa", "or"]
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def convert_to_wav(source_path):
    target_path = source_path.rsplit(".", 1)[0] + ".wav"
    subprocess.run(["ffmpeg", "-y", "-i", source_path, target_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return target_path

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html", languages=ALLOWED_LANGUAGES)

@app.route("/synthesize", methods=["POST"])
def synthesize():
    try:
        text = request.form["text"]
        ref_text = request.form.get("ref_text") or text
        language_code = request.form.get("language", "kn").lower()

        if language_code not in ALLOWED_LANGUAGES:
            return jsonify({"success": False, "error": f"Language '{language_code}' not supported. Choose from {', '.join(ALLOWED_LANGUAGES)}."})

        uploaded_file = request.files["audio"]
        ext = uploaded_file.filename.rsplit(".", 1)[-1].lower()
        uid = uuid.uuid4().hex
        raw_path = os.path.join(UPLOAD_FOLDER, f"{uid}.{ext}")
        uploaded_file.save(raw_path)

        if ext != "wav":
            wav_path = convert_to_wav(raw_path)
        else:
            wav_path = raw_path

        result_path = client.predict(
            text=text,
            ref_audio=handle_file(wav_path),
            ref_text=ref_text,
            api_name="/synthesize_speech"
        )

        output_id = f"{int(time.time())}_{uid}.wav"
        final_output_path = os.path.join(OUTPUT_FOLDER, output_id)
        shutil.copy(result_path, final_output_path)

        for f in os.listdir(UPLOAD_FOLDER):
            p = os.path.join(UPLOAD_FOLDER, f)
            if os.path.isfile(p) and time.time() - os.path.getmtime(p) > 600:
                os.remove(p)
        for f in os.listdir(OUTPUT_FOLDER):
            p = os.path.join(OUTPUT_FOLDER, f)
            if os.path.isfile(p) and time.time() - os.path.getmtime(p) > 1800:
                os.remove(p)

        return jsonify({"success": True, "url": f"/{final_output_path}"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
