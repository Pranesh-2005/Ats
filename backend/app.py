import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from resume_ai import score, improve
import PyPDF2
import io

load_dotenv()
app = Flask(__name__)
CORS(app)

def extract_text_from_pdf(pdf_file):
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise ValueError(f"Error reading PDF: {str(e)}")

@app.route("/score", methods=["POST"])
def score_route():
    try:
        # Check for resume file
        if "resume" not in request.files:
            return jsonify({"error": "Missing resume file"}), 400
        
        # Check for job description text
        if "jd" not in request.form:
            return jsonify({"error": "Missing job description"}), 400
        
        resume_file = request.files["resume"]
        jd_text = request.form["jd"]
        
        # Extract text from PDF resume
        if resume_file.filename.lower().endswith('.pdf'):
            resume_text = extract_text_from_pdf(resume_file)
        else:
            # Fallback for text files
            resume_text = resume_file.read().decode('utf-8')
        
        # Use your existing score function
        result = score(resume_text, jd_text)
        return jsonify(result)
    
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route("/improve", methods=["POST"])
def improve_route():
    try:
        # Check for resume file
        if "resume" not in request.files:
            return jsonify({"error": "Missing resume file"}), 400
        
        resume_file = request.files["resume"]
        jd_text = request.form.get("jd", None)  # Optional
        
        # Extract text from PDF resume
        if resume_file.filename.lower().endswith('.pdf'):
            resume_text = extract_text_from_pdf(resume_file)
        else:
            # Fallback for text files
            resume_text = resume_file.read().decode('utf-8')
        
        # Use your existing improve function
        suggestions = improve(resume_text, jd_text)
        return jsonify({"suggestions": suggestions})
    
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500
if __name__ == "__main__":
    # Get port from environment variable (Render provides this) or default to 5000 for local
    port = int(os.environ.get("PORT", 5000))
    # Bind to 0.0.0.0 to accept connections from any IP (required for Render)
    app.run(host="0.0.0.0", port=port, debug=False)