import io
import json
from typing import Optional

import gradio as gr
import PyPDF2

from resume_ai import score, improve

def extract_text_from_pdf(file_obj: io.IOBase) -> str:
    """Extract text from a PDF file-like object."""
    try:
        reader = PyPDF2.PdfReader(file_obj)
        text_chunks = []
        for page in reader.pages:
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
    Accepts a file-like object and returns text content.
    Supports PDF and plain text files.
    """
    if resume_file is None:
        raise ValueError("Please upload a resume file.")

    filename = getattr(resume_file, "name", "").lower()
    resume_file.seek(0)
    data = resume_file.read()

    if not data:
        raise ValueError("Uploaded file is empty.")

    if filename.endswith(".pdf"):
        resume_file.seek(0)
        return extract_text_from_pdf(resume_file)

    # Plain text fallback
    try:
        return data.decode("utf-8").strip()
    except UnicodeDecodeError:
        return data.decode("latin-1").strip()

def score_fn(resume_file, job_desc: str) -> str:
    try:
        if not job_desc or not job_desc.strip():
            raise ValueError("Please paste a job description.")
        resume_text = read_resume_to_text(resume_file)
        result = score(resume_text, job_desc)
        return json.dumps(result, indent=2, ensure_ascii=False)
    except Exception as e:
        return f"Error: {e}"

def improve_fn(resume_file, job_desc: Optional[str]) -> str:
    try:
        resume_text = read_resume_to_text(resume_file)
        jd_text = job_desc if job_desc and job_desc.strip() else None
        suggestions = improve(resume_text, jd_text)
        if isinstance(suggestions, (list, tuple)):
            bullets = "\n".join(f"- {s}" for s in suggestions)
            return f"### Suggestions\n{bullets}"
        elif isinstance(suggestions, dict):
            return "```json\n" + json.dumps(suggestions, indent=2, ensure_ascii=False) + "\n```"
        else:
            return str(suggestions)
    except Exception as e:
        return f"Error: {e}"

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
        resume = gr.File(label="Upload Resume (PDF or TXT)", file_types=[".pdf", ".txt"], type="file")
        jd = gr.Textbox(label="Job Description (paste here)", lines=10, placeholder="Paste JD text...")

    with gr.Row():
        score_btn = gr.Button("⚖️ Score Resume", variant="primary")
        improve_btn = gr.Button("✨ Improve Resume")

    score_out = gr.Code(label="Score (JSON)", language="json")
    improve_out = gr.Markdown(label="Improvement Suggestions")

    score_btn.click(fn=score_fn, inputs=[resume, jd], outputs=score_out)
    improve_btn.click(fn=improve_fn, inputs=[resume, jd], outputs=improve_out)

if __name__ == "__main__":
    demo.queue().launch()