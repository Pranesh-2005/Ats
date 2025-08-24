import io
import json
from typing import Optional

import gradio as gr
import PyPDF2

# your existing functions (kept exactly as-is, just imported)
from resume_ai import score, improve


def extract_text_from_pdf(file_obj: io.BytesIO) -> str:
    """Extract text from a PDF-like file object."""
    try:
        reader = PyPDF2.PdfReader(file_obj)
        text_chunks = []
        for page in reader.pages:
            # page.extract_text() can return None; guard it
            page_text = page.extract_text() or ""
            text_chunks.append(page_text)
        text = "\n".join(text_chunks).strip()
        if not text:
            raise ValueError("No extractable text found in PDF.")
        return text
    except Exception as e:
        raise ValueError(f"Error reading PDF: {e}")


def read_resume_to_text(resume_file) -> str:
    """
    Accepts a gradio file object (dict-like) and returns text content.
    Supports PDF and plain text files.
    """
    if resume_file is None:
        raise ValueError("Please upload a resume file.")

    name: str = resume_file.get("name", "").lower()
    data: bytes = resume_file.get("data", b"")

    if not data:
        raise ValueError("Uploaded file is empty.")

    # PDF path
    if name.endswith(".pdf"):
        return extract_text_from_pdf(io.BytesIO(data))

    # Plain text fallback
    try:
        return data.decode("utf-8").strip()
    except UnicodeDecodeError:
        # last-ditch: try latin-1
        return data.decode("latin-1").strip()


# ------------------- Gradio callback fns -------------------

def score_fn(resume_file, job_desc: str) -> str:
    """
    Wraps your `score()` to be Gradio-friendly.
    Returns pretty JSON for display.
    """
    try:
        if not job_desc or not job_desc.strip():
            raise ValueError("Please paste a job description.")

        resume_text = read_resume_to_text(resume_file)
        result = score(resume_text, job_desc)  # your existing function
        # pretty print JSON for UI
        return json.dumps(result, indent=2, ensure_ascii=False)
    except Exception as e:
        # Show as error string in output
        return f"Error: {e}"


def improve_fn(resume_file, job_desc: Optional[str]) -> str:
    """
    Wraps your `improve()` to be Gradio-friendly.
    Returns markdown suggestions.
    """
    try:
        resume_text = read_resume_to_text(resume_file)
        jd_text = job_desc if job_desc and job_desc.strip() else None
        suggestions = improve(resume_text, jd_text)  # your existing function

        # Render suggestions smartly depending on type
        if isinstance(suggestions, (list, tuple)):
            bullets = "\n".join(f"- {s}" for s in suggestions)
            return f"### Suggestions\n{bullets}"
        elif isinstance(suggestions, dict):
            return "```json\n" + json.dumps(suggestions, indent=2, ensure_ascii=False) + "\n```"
        else:
            return str(suggestions)
    except Exception as e:
        return f"Error: {e}"


# ------------------- UI -------------------

with gr.Blocks(title="Resume AI (Score & Improve)") as demo:
    gr.Markdown(
        """
        # 📄 Resume AI — Score & Improve
        Upload your resume (PDF or TXT), paste a Job Description, and get:
        - **Score**: a JSON score/breakdown from your `score()` function  
        - **Improve**: actionable suggestions from your `improve()` function
        """
    )

    with gr.Row():
        resume = gr.File(label="Upload Resume (PDF or TXT)", file_types=[".pdf", ".txt"], type="binary")
        jd = gr.Textbox(label="Job Description (paste here)", lines=10, placeholder="Paste JD text...")

    with gr.Row():
        score_btn = gr.Button("⚖️ Score Resume", variant="primary")
        improve_btn = gr.Button("✨ Improve Resume")

    score_out = gr.Code(label="Score (JSON)", language="json")
    improve_out = gr.Markdown(label="Improvement Suggestions")

    score_btn.click(fn=score_fn, inputs=[resume, jd], outputs=score_out)
    improve_btn.click(fn=improve_fn, inputs=[resume, jd], outputs=improve_out)

# For Hugging Face Spaces
# (Spaces will discover the variable `demo` and run it.)
if __name__ == "__main__":
    demo.queue().launch()
