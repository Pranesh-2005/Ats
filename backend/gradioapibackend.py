import os
import shutil
import tempfile
from flask_cors import CORS
import threading
import time
from flask import Flask, request, jsonify
from gradio_client import Client, handle_file

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "tmp")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

client = Client("PraneshJs/ATSScoreCheckerAndSuggestor")
app = Flask(__name__)
CORS(app)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def schedule_cleanup(file_path, delay=300):
    def cleanup():
        time.sleep(delay)
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass
    threading.Thread(target=cleanup, daemon=True).start()

@app.route("/score", methods=["POST"])
def score_api():
    if "resume" not in request.files or "jd" not in request.form:
        return jsonify({"error": "Missing resume or job description"}), 400

    resume = request.files["resume"]
    jd = request.form["jd"]

    # Save file to tmp folder
    tmp_path = os.path.join(app.config['UPLOAD_FOLDER'], resume.filename)
    resume.save(tmp_path)
    schedule_cleanup(tmp_path)

    try:
        result = client.predict(
            resume_file_path=handle_file(tmp_path),
            job_desc=jd,
            api_name="/score_fn_display"
        )
        return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/improve", methods=["POST"])
def improve_api():
    if "resume" not in request.files or "jd" not in request.form:
        return jsonify({"error": "Missing resume or job description"}), 400

    resume = request.files["resume"]
    jd = request.form["jd"]

    # Save file to tmp folder
    tmp_path = os.path.join(app.config['UPLOAD_FOLDER'], resume.filename)
    resume.save(tmp_path)
    schedule_cleanup(tmp_path)

    try:
        result = client.predict(
            resume_file_path=handle_file(tmp_path),
            job_desc=jd,
            api_name="/improve_fn"
        )
        return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)