# 🎙️ AI-Powered Interviewing System  
**Automating academic interviews in computer science using AI**  

## 🚀 Overview  
This project is an **AI-powered interviewing system** designed to streamline **computer science academic interviews**. The system automates interviews using **LLMs**, **speech processing**, **answer evaluation**, and **facial expression analysis**, improving efficiency for recruiters and candidates.  

---

## 🔥 Key Features  

### 📌 Job Posting & Applications  
- Recruiters post job descriptions, required skills, and experience.  
- Candidates apply, attempt the interview.
- Recruiters can shortlist the candidate based on performance measured.  

### 🗣️ AI-Driven Interview Process  
- **🔹 Question Generation:** Uses **LLMs** to generate job-specific questions.  
- **🔹 Speech Processing:** Converts questions to speech and candidate responses to text.  
- **🔹 Answer Evaluation:**  
  - **Intent Classification** to understand responses.  
  - **Named Entity Recognition (NER)** for skills and organization detection.  
  - **Semantic Similarity** to compare responses with expected answers.  
- **🔹 Dynamic Dialogue Management:** Adjusts follow-up questions based on responses.  
- **🔹 Visual Analysis:** Captures **facial expressions** to assess **confidence** and **emotional state**.  
- **🔹 Performance Scoring:** Weighs different factors to rank candidates, aiding recruiters.  

---

## 🎯 Success Criteria  
- **85% accuracy** in answer and confidence classification.  
- **80% match** between system-shortlisted candidates and recruiter decisions.  

---

## 🏗️ Tech Stack  
| **Component**   | **Technology**  |
|----------------|---------------|
| Frontend       | React         |
| Backend        | Django        |
| LLM Models     | Ollama        |
| Face Processing | MTCNN, DeepFace |
| Speech Processing | Testing STT, and TTS models |
| NLP Techniques | Named Entity Recognition, Intent Classification, Semantic Similarity |

---

## 🛠️ Installation Guide  

### **Prerequisites**  
Ensure you have the following installed:  
- Python 3.x  
- Node.js & npm  
- PostgreSQL or SQLite  
- Virtual environment (`venv` or `conda`)  

### **Backend Setup (Django)**
---
- cd Backend
- python -m venv venv
- venv\Scripts\Activate
- pip install Django
- pip install djangorestframework-simplejwt
- pip install djangorestframework
- pip install social-auth-app-Django
- pip install django-filter
- pip install google-auth google-auth-oauthlib google-auth-httplib2
- pip install huggingface_hub
- pip install transformers accelerate sentencepiece
- pip install groq
- pip install numpy
- pip install opencv-python
- pip install tensorflow==2.20
- pip install deepface
- python.exe -m pip install --upgrade pip
- pip install django-cors-headers
- pip install drf-yasg
- pip install pillow
- python manage.py migrate
- python manage.py runserver

---
### **Frontend Setup (React)**
---
- cd Frontend
- npm install
- npm run dev
---
### **Admin Dashboard**
---
- http://127.0.0.1:8000/admin/
- username:  omair
- Password:  namal123

- python manage.py createsuperuser
---
### **Github Commands**
- git status
- git add .
- git commit -m "Your comments"
- git push origin main

- git pull origin main