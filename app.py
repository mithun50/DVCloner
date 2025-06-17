from flask import Flask, render_template, request, jsonify, redirect, url_for
from gradio_client import Client, handle_file
import os
import uuid
import subprocess
import time
import shutil
import json
from werkzeug.middleware.proxy_fix import ProxyFix
import datetime
import requests
from collections import defaultdict

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

# Environment Variables
# Set ADMIN_PASSWORD in Replit Secrets for security
client = Client("https://ai4bharat-indicf5.hf.space/")

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "static/outputs"
ALLOWED_LANGUAGES = ["kn", "hi", "ta", "te", "gu", "ml", "mr", "bn", "pa", "or"]
LANGUAGE_NAMES = {
    "kn": "Kannada",
    "hi": "Hindi", 
    "ta": "Tamil",
    "te": "Telugu",
    "gu": "Gujarati",
    "ml": "Malayalam",
    "mr": "Marathi",
    "bn": "Bengali",
    "pa": "Punjabi",
    "or": "Odia"
}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Visitor tracking and analytics
VISITOR_FILE = "visitors.json"
ANALYTICS_FILE = "analytics.json"

if not os.path.exists(VISITOR_FILE):
    with open(VISITOR_FILE, "w") as f:
        json.dump({"total": 0, "daily": {}}, f)

if not os.path.exists(ANALYTICS_FILE):
    with open(ANALYTICS_FILE, "w") as f:
        json.dump({
            "language_usage": {},
            "synthesis_count": 0,
            "error_count": 0,
            "daily_synthesis": {},
            "file_uploads": 0,
            "avg_text_length": 0,
            "hourly_activity": {}
        }, f)

def track_visitor():
    today = time.strftime("%Y-%m-%d")
    with open(VISITOR_FILE, "r+") as f:
        data = json.load(f)
        data["total"] += 1
        if today in data["daily"]:
            data["daily"][today] += 1
        else:
            data["daily"][today] = 1
        f.seek(0)
        json.dump(data, f)
        f.truncate()

def track_synthesis(language, text_length, success=True):
    today = time.strftime("%Y-%m-%d")
    hour = time.strftime("%H")
    
    with open(ANALYTICS_FILE, "r+") as f:
        data = json.load(f)
        
        # Language usage
        if language in data["language_usage"]:
            data["language_usage"][language] += 1
        else:
            data["language_usage"][language] = 1
        
        # Synthesis count
        if success:
            data["synthesis_count"] += 1
            
            # Daily synthesis
            if today in data["daily_synthesis"]:
                data["daily_synthesis"][today] += 1
            else:
                data["daily_synthesis"][today] = 1
            
            # Update average text length
            current_avg = data.get("avg_text_length", 0)
            current_count = data["synthesis_count"]
            data["avg_text_length"] = ((current_avg * (current_count - 1)) + text_length) / current_count
            
            # File uploads
            data["file_uploads"] += 1
        else:
            data["error_count"] += 1
        
        # Hourly activity
        if hour in data["hourly_activity"]:
            data["hourly_activity"][hour] += 1
        else:
            data["hourly_activity"][hour] = 1
        
        f.seek(0)
        json.dump(data, f)
        f.truncate()

def get_system_stats():
    """Get system statistics"""
    stats = {}
    
    # Disk usage
    upload_size = sum(os.path.getsize(os.path.join(UPLOAD_FOLDER, f)) 
                     for f in os.listdir(UPLOAD_FOLDER) if os.path.isfile(os.path.join(UPLOAD_FOLDER, f)))
    output_size = sum(os.path.getsize(os.path.join(OUTPUT_FOLDER, f)) 
                     for f in os.listdir(OUTPUT_FOLDER) if os.path.isfile(os.path.join(OUTPUT_FOLDER, f)))
    
    stats["upload_folder_size"] = round(upload_size / 1024 / 1024, 2)  # MB
    stats["output_folder_size"] = round(output_size / 1024 / 1024, 2)  # MB
    stats["upload_file_count"] = len([f for f in os.listdir(UPLOAD_FOLDER) if os.path.isfile(os.path.join(UPLOAD_FOLDER, f))])
    stats["output_file_count"] = len([f for f in os.listdir(OUTPUT_FOLDER) if os.path.isfile(os.path.join(OUTPUT_FOLDER, f))])
    
    return stats

def convert_to_wav(source_path):
    target_path = source_path.rsplit(".", 1)[0] + ".wav"
    subprocess.run(["ffmpeg", "-y", "-i", source_path, target_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return target_path

def is_indic_text(text):
    """
    Enhanced language detection for Indian languages using Unicode ranges
    """
    if not text or not text.strip():
        return False
    
    # Remove whitespace and punctuation for analysis
    clean_text = ''.join(char for char in text if char.isalpha())
    
    if not clean_text:
        return False
    
    # Count Indian language characters vs English characters
    indic_chars = 0
    english_chars = 0
    
    for char in clean_text:
        code_point = ord(char)
        
        # English alphabet range
        if (65 <= code_point <= 90) or (97 <= code_point <= 122):
            english_chars += 1
        # Indian language Unicode ranges
        elif (
            (0x0900 <= code_point <= 0x097F) or  # Devanagari (Hindi, Marathi)
            (0x0980 <= code_point <= 0x09FF) or  # Bengali
            (0x0A00 <= code_point <= 0x0A7F) or  # Gurmukhi (Punjabi)
            (0x0A80 <= code_point <= 0x0AFF) or  # Gujarati
            (0x0B00 <= code_point <= 0x0B7F) or  # Oriya
            (0x0B80 <= code_point <= 0x0BFF) or  # Tamil
            (0x0C00 <= code_point <= 0x0C7F) or  # Telugu
            (0x0C80 <= code_point <= 0x0CFF) or  # Kannada
            (0x0D00 <= code_point <= 0x0D7F)     # Malayalam
        ):
            indic_chars += 1
    
    total_chars = indic_chars + english_chars
    
    # Text should be predominantly (>70%) in Indian languages
    if total_chars > 0:
        indic_percentage = (indic_chars / total_chars) * 100
        return indic_percentage > 70
    
    # Fallback: if no English/Indic chars found, check for any non-ASCII
    return any(ord(char) > 127 for char in text)

@app.route("/", methods=["GET"])
def index():
    track_visitor()
    examples = {
        "kn": {"text": "ನಮಸ್ಕಾರ, ಇದು ಕನ್ನಡ ಭಾಷೆಯ ಉದಾಹರಣೆ", "ref_text": "ನಮಸ್ಕಾರ"},
        "hi": {"text": "नमस्ते, यह हिंदी भाषा का उदाहरण है", "ref_text": "नमस्ते"},
        "ta": {"text": "வணக்கம், இது தமிழ் மொழியின் எடுத்துக்காட்டு", "ref_text": "வணக்கம்"},
        "te": {"text": "నమస్కారం, ఇది తెలుగు భాషకు ఉదాహరణ", "ref_text": "నమస్కారం"},
        "gu": {"text": "નમસ્તે, આ ગુજરાતી ભાષાનું ઉદાહરણ છે", "ref_text": "નમસ્તે"},
        "ml": {"text": "നമസ്കാരം, ഇത് മലയാള ഭാഷയുടെ ഉദാഹരണമാണ്", "ref_text": "നമസ്കാരം"},
        "mr": {"text": "नमस्कार, हे मराठी भाषेचे उदाहरण आहे", "ref_text": "नमस्कार"},
        "bn": {"text": "নমস্কার, এটি বাংলা ভাষার একটি উদাহরণ", "ref_text": "নমস্কার"},
        "pa": {"text": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਇਹ ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਦੀ ਇੱਕ ਉਦਾਹਰਣ ਹੈ", "ref_text": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ"},
        "or": {"text": "ନମସ୍କାର, ଏହି ଓଡ଼ିଆ ଭାଷାର ଏକ ଉଦାହରଣ", "ref_text": "ନମସ୍କାର"}
    }
    return render_template("index.html", languages=ALLOWED_LANGUAGES, language_names=LANGUAGE_NAMES, examples=examples)

@app.route("/synthesize", methods=["POST"])
def synthesize():
    try:
        text = request.form["text"]
        ref_text = request.form.get("ref_text") or text
        language_code = request.form.get("language", "kn").lower()

        # Enhanced language validation
        if language_code not in ALLOWED_LANGUAGES:
            track_synthesis(language_code, len(text), success=False)
            return jsonify({"success": False, "error": f"Language '{language_code}' not supported. Choose from {', '.join(ALLOWED_LANGUAGES)}."})
        
        if not is_indic_text(text):
            track_synthesis(language_code, len(text), success=False)
            return jsonify({"success": False, "error": "Text must be predominantly in an Indian language. English or mixed language text is not supported."})
            
        if not is_indic_text(ref_text):
            track_synthesis(language_code, len(text), success=False)
            return jsonify({"success": False, "error": "Reference text must be predominantly in an Indian language. English or mixed language text is not supported."})

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

        # Track successful synthesis
        track_synthesis(language_code, len(text), success=True)

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
        track_synthesis(language_code if 'language_code' in locals() else 'unknown', 
                       len(text) if 'text' in locals() else 0, success=False)
        return jsonify({"success": False, "error": str(e)})

@app.route("/api/contributors")
def get_contributors():
    try:
        response = requests.get("https://api.github.com/repos/mithun50/dvcloner/contributors", timeout=10)
        if response.status_code == 200:
            contributors = response.json()
            # Get detailed user info for each contributor
            detailed_contributors = []
            for user in contributors:
                try:
                    user_response = requests.get(f"https://api.github.com/users/{user['login']}", timeout=5)
                    if user_response.status_code == 200:
                        user_details = user_response.json()
                        user['name'] = user_details.get('name')
                    detailed_contributors.append(user)
                except:
                    detailed_contributors.append(user)
            return jsonify(detailed_contributors)
        else:
            return jsonify({"error": f"GitHub API error: {response.status_code}"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/clear-files", methods=["POST"])
def clear_files():
    admin_password = os.environ.get("ADMIN_PASSWORD", "@Mithun")
    if request.args.get("password") != admin_password:
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    
    try:
        # Clear upload folder
        for f in os.listdir(UPLOAD_FOLDER):
            p = os.path.join(UPLOAD_FOLDER, f)
            if os.path.isfile(p):
                os.remove(p)
        
        # Clear output folder
        for f in os.listdir(OUTPUT_FOLDER):
            p = os.path.join(OUTPUT_FOLDER, f)
            if os.path.isfile(p):
                os.remove(p)
        
        return jsonify({"success": True, "message": "All temporary files cleared"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/admin")
def admin():
    admin_password = os.environ.get("ADMIN_PASSWORD", "@Mithun")
    if request.args.get("password") != admin_password:
        return "Unauthorized", 401
    
    # Load visitor data
    with open(VISITOR_FILE, "r") as f:
        visitor_data = json.load(f)
    
    # Load analytics data
    with open(ANALYTICS_FILE, "r") as f:
        analytics_data = json.load(f)
    
    # Get system statistics
    system_stats = get_system_stats()
    
    # Format dates in Python instead of in template
    formatted_visitors = {
        datetime.datetime.strptime(date, "%Y-%m-%d").strftime("%b %d, %Y"): count
        for date, count in visitor_data["daily"].items()
    }
    
    # Sort by date
    sorted_dates = sorted(
        formatted_visitors.keys(),
        key=lambda x: datetime.datetime.strptime(x, "%b %d, %Y")
    )
    
    # Calculate success rate
    total_requests = analytics_data["synthesis_count"] + analytics_data["error_count"]
    success_rate = (analytics_data["synthesis_count"] / total_requests * 100) if total_requests > 0 else 0
    
    # Get most popular language
    popular_lang = max(analytics_data["language_usage"], key=analytics_data["language_usage"].get) if analytics_data["language_usage"] else "N/A"
    
    # Prepare hourly activity data
    hourly_labels = [f"{i:02d}:00" for i in range(24)]
    hourly_data = [analytics_data["hourly_activity"].get(f"{i:02d}", 0) for i in range(24)]
    
    return render_template(
        "admin.html",
        total_visitors=visitor_data["total"],
        daily_visitors=formatted_visitors,
        dates=sorted_dates,
        counts=[formatted_visitors[date] for date in sorted_dates],
        analytics=analytics_data,
        system_stats=system_stats,
        success_rate=round(success_rate, 2),
        popular_language=LANGUAGE_NAMES.get(popular_lang, popular_lang),
        hourly_labels=hourly_labels,
        hourly_data=hourly_data,
        language_names=LANGUAGE_NAMES
    )

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
