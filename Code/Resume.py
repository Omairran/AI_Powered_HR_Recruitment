import re
import json
import pdfplumber
import docx2txt
import spacy

# Load NLP model
nlp = spacy.load("en_core_web_sm")


# -----------------------------
# 1. File Loader (PDF/DOCX/TXT)
# -----------------------------
def load_resume(file_path):
    if file_path.endswith(".pdf"):
        return extract_text_from_pdf(file_path)
    elif file_path.endswith(".docx"):
        return extract_text_from_docx(file_path)
    elif file_path.endswith(".txt"):
        return extract_text_from_txt(file_path)
    else:
        raise ValueError("Unsupported file type")


def extract_text_from_pdf(path):
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text


def extract_text_from_docx(path):
    return docx2txt.process(path)


def extract_text_from_txt(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


# --------------------------------
# 2. Basic Pre-processing & Clean
# --------------------------------
def clean_text(text):
    text = re.sub(r'\s+', ' ', text)              # remove extra whitespace
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)     # remove non-ASCII
    return text.strip()


# --------------------------------
# 3. NLP-Based Resume Information
# --------------------------------
def extract_entities(text):
    doc = nlp(text)
    
    entities = {
        "name": None,
        "emails": [],
        "phones": [],
        "education": [],
        "experience": [],
        "skills": []
    }

    # Extract emails
    entities["emails"] = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)

    # Extract phone numbers
    entities["phones"] = re.findall(r"\+?\d[\d -]{8,}\d", text)

    # Named entity detection
    for ent in doc.ents:
        if ent.label_ == "PERSON" and entities["name"] is None:
            entities["name"] = ent.text
        elif ent.label_ in ["ORG", "WORK_OF_ART"]:
            entities["experience"].append(ent.text)
        elif ent.label_ in ["GPE", "LOC"]:
            pass
        elif ent.label_ in ["EDUCATION", "DEGREE"]:
            entities["education"].append(ent.text)

    return entities


# -------------------------------------------
# 4. Skill Extraction (Simple Keyword Approach)
# -------------------------------------------
def extract_skills(text):
    common_skills = [
        "Python", "Java", "SQL", "Machine Learning", "Deep Learning", "Django",
        "React", "JavaScript", "AWS", "Docker", "Kubernetes", "NLP",
        "TensorFlow", "PyTorch", "Data Analysis"
    ]
    found = []

    for skill in common_skills:
        if skill.lower() in text.lower():
            found.append(skill)

    return found


# -----------------------------
# 5. Master Resume Parser
# -----------------------------
def parse_resume(file_path):
    raw = load_resume(file_path)
    cleaned = clean_text(raw)
    entities = extract_entities(cleaned)

    # add skills
    entities["skills"] = extract_skills(cleaned)

    return entities


# -----------------------------
# 6. Example Usage
# -----------------------------
if __name__ == "__main__":
    result = parse_resume("sample_resume.pdf")
    print(json.dumps(result, indent=4))
