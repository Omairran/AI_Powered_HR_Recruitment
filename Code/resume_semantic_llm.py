"""
resume_semantic_llm.py

Features:
- load resumes (pdf/docx/txt)
- light local parsing (regex + spaCy) as a fallback
- semantic matching using sentence-transformers embeddings + cosine similarity
- LLM-powered parsing using OpenAI ChatCompletion (returns strict JSON)
"""

import os
import re
import json
from typing import List, Dict, Any, Tuple
import pdfplumber
import docx2txt
import spacy
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import openai

# --------------------------
# Configuration / models
# --------------------------
nlp = spacy.load("en_core_web_sm")
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"  # compact and effective
embed_model = SentenceTransformer(EMBEDDING_MODEL_NAME)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY


# --------------------------
# 1) File loaders
# --------------------------
def load_resume_text(path: str) -> str:
    path = path.strip()
    if path.lower().endswith(".pdf"):
        return _extract_text_from_pdf(path)
    if path.lower().endswith(".docx"):
        return _extract_text_from_docx(path)
    if path.lower().endswith(".txt"):
        return _extract_text_from_txt(path)
    raise ValueError(f"Unsupported file extension for {path}")


def _extract_text_from_pdf(path: str) -> str:
    text = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            p = page.extract_text()
            if p:
                text.append(p)
    return "\n".join(text)


def _extract_text_from_docx(path: str) -> str:
    return docx2txt.process(path) or ""


def _extract_text_from_txt(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


# --------------------------
# 2) Light local parsing
# --------------------------
EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(r"\+?\d[\d\-\s]{7,}\d")

COMMON_SKILLS = [
    "python", "java", "sql", "machine learning", "deep learning", "nlp",
    "react", "javascript", "aws", "docker", "kubernetes", "tensorflow",
    "pytorch", "c++", "c#", "excel", "powerbi", "tableau", "linux",
    "django", "flask"
]


def clean_text(text: str) -> str:
    text = re.sub(r"\r", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[^\x00-\x7F]+", " ", text)  # remove non-ascii
    return text.strip()


def lightweight_parse(text: str) -> Dict[str, Any]:
    t = clean_text(text)
    doc = nlp(t)

    # name: first PERSON entity
    name = None
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            name = ent.text
            break

    emails = EMAIL_REGEX.findall(t)
    phones = PHONE_REGEX.findall(t)

    # naive education detection (degrees + keywords)
    education_lines = []
    for line in t.splitlines():
        if re.search(r"\b(Bachelor|Master|B\.Sc|M\.Sc|BA|BS|MS|PhD|Doctorate|MBA)\b", line, re.I):
            education_lines.append(line.strip())

    # naive experience detection: lines containing "experience", "company", "worked", "at"
    experience_lines = []
    for line in t.splitlines():
        if re.search(r"\b(company|inc|llc|worked|experience|engineer|developer|consultant|manager)\b", line, re.I):
            experience_lines.append(line.strip())

    # skills: match from COMMON_SKILLS
    lower = t.lower()
    skills_found = sorted({s for s in COMMON_SKILLS if s in lower})

    return {
        "name": name,
        "emails": emails,
        "phones": phones,
        "education": education_lines,
        "experience_snippets": experience_lines[:10],
        "skills": skills_found,
        "raw_text_snippet": t[:2000]
    }


# --------------------------
# 3) Semantic Matching
# --------------------------
def embed_texts(texts: List[str]) -> np.ndarray:
    """
    Return numpy array of embeddings, shape (len(texts), dim)
    """
    embeddings = embed_model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    return embeddings


def score_job_against_resumes(job_description: str, resume_texts: List[str]) -> List[Dict[str, Any]]:
    """
    Computes semantic similarity between job_description and each resume_text.
    Returns a list of dicts with score and explanation snippets.
    """
    all_texts = [job_description] + resume_texts
    embs = embed_texts(all_texts)
    job_emb = embs[0:1]  # shape (1, dim)
    resume_embs = embs[1:]

    sims = cosine_similarity(job_emb, resume_embs)[0]  # shape (n,)
    results = []
    for idx, score in enumerate(sims):
        # generate simple explainability: count keyword overlaps (job vs resume)
        overlap = _simple_keyword_overlap(job_description, resume_texts[idx])
        results.append({
            "resume_index": idx,
            "score": float(score),
            "overlap_count": overlap["count"],
            "overlap_keywords": overlap["keywords"],
            "resume_snippet": resume_texts[idx][:800]
        })

    # sort descending by score
    results = sorted(results, key=lambda x: x["score"], reverse=True)
    return results


def _simple_keyword_overlap(job_desc: str, resume_text: str, top_k: int = 10) -> Dict[str, Any]:
    # extract tokens from job description and resume, match words longer than 3 chars
    def tokens(s):
        words = re.findall(r"\b[a-zA-Z0-9\+\#\.\-]{3,}\b", s.lower())
        return set(words)

    job_tokens = tokens(job_desc)
    res_tokens = tokens(resume_text)
    common = job_tokens.intersection(res_tokens)
    # filter out too-generic tokens
    stop = {"the", "and", "for", "with", "your", "company", "work", "experience"}
    keywords = [k for k in common if k not in stop]
    return {"count": len(keywords), "keywords": sorted(keywords)[:top_k]}


# --------------------------
# 4) LLM-powered parsing
# --------------------------
LLM_PROMPT = """
You are a strict JSON extractor: given a resume text, return ONLY JSON (no surrounding text, no markdown)
with the following schema exactly:

{{
  "name": string or null,
  "emails": [string],
  "phones": [string],
  "summary": string or null,
  "education": [{"degree": string or null, "institution": string or null, "dates": string or null}],
  "experience": [{"title": string or null, "company": string or null, "start_date": string or null, "end_date": string or null, "description": string or null}],
  "skills": [string],
  "certifications": [string],
  "locations": [string]
}}

Return null or empty lists where appropriate. Be concise in fields. Use the resume text below delimited by triple backticks.

Resume text:
