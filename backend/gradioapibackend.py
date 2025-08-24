from gradio_client import Client, handle_file

# Initialize the Gradio Space client
client = Client("PraneshJs/ATSScoreCheckerAndSuggestor")

# Example usage for /score_fn_display
def get_score(resume_path, job_desc):
    result = client.predict(
        resume_file_path=handle_file(resume_path),
        job_desc=job_desc,
        api_name="/score_fn_display"
    )
    return result

# Example usage for /improve_fn
def get_improvement_suggestions(resume_path, job_desc):
    result = client.predict(
        resume_file_path=handle_file(resume_path),
        job_desc=job_desc,
        api_name="/improve_fn"
    )
    return result

if __name__ == "__main__":
    # Replace with your local file path and job description
    resume_file = "your_resume.pdf"  # or "your_resume.txt"
    job_description = "Paste your job description here."

    # Get ATS score
    print("=== ATS Score ===")
    score_result = get_score(resume_file, job_description)
    print(score_result)

    # Get improvement suggestions
    print("\n=== Improvement Suggestions ===")
    improve_result = get_improvement_suggestions(resume_file, job_description)
    print(improve_result)