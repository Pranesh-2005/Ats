import os, json
from openai import AzureOpenAI
from dotenv import load_dotenv


load_dotenv()
client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version=os.getenv("AZURE_OPENAI_VERSION")
)
DEPLOY = os.getenv("AZURE_OPENAI_DEPLOYMENT")

def score(resume, jd):
    r = client.chat.completions.create(
        model=DEPLOY,
        max_completion_tokens=400,
        temperature=0.8,
        messages=[
            {"role":"system","content":"Act as an ATS. Compare résumé with JD. Return JSON: overall_score(0-100) and category_scores{skills,experience,education}, plus top_skill_gaps list In a way that will be easy to parse by markdown cdn"},
            {"role":"user","content":f"JOB_DESCRIPTION:\n{jd}\n\nRESUME:\n{resume}"}
        ]
    )
    return json.loads(r.choices[0].message.content.strip())

def improve(resume, jd=None):
    p = ("Provide bullet suggestions to raise the score. " + ("Tailor to this JD:\n"+jd+"\n" if jd else "") + "Here is the résumé:\n"+resume)
    r = client.chat.completions.create(
        model=DEPLOY,
        max_completion_tokens=400,
        temperature=0.7,
        messages=[
            {"role":"system","content":"You are a résumé coach.Give results In a way that will be easy to parse by markdown cdn"},
            {"role":"user","content":p}
        ]
    )
    return r.choices[0].message.content.strip()
