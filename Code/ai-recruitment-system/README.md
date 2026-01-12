# AI-Powered Recruitment System - Module 1
## Complete Setup & Usage Guide

**Project:** Final Year Project (FYP)  
**Module:** 1 - Candidate Application & Resume Upload  
**Tech Stack:** Django 4.2 + React 18 + spaCy NLP

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [API Documentation](#api-documentation)
8. [Troubleshooting](#troubleshooting)
9. [Project Structure](#project-structure)

---

## Prerequisites

### Required Software

```bash
# Check versions
python --version  # Need 3.10+
node --version    # Need 18+
npm --version     # Need 9+
pip --version     # Should be installed with Python
```

### Install if Missing

**Windows:**
- Python: https://www.python.org/downloads/
- Node.js: https://nodejs.org/

**macOS:**
```bash
brew install python@3.10
brew install node
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3.10 python3-pip nodejs npm
```

---

## Installation

### Step 1: Create Project Directory

```bash
# Create main folder
mkdir ai-recruitment-system
cd ai-recruitment-system

# Create backend and frontend folders
mkdir backend
mkdir frontend
```

---

## Backend Setup

### Step 1: Navigate to Backend

```bash
cd backend
```

### Step 2: Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Verify activation:** You should see `(venv)` in your terminal prompt.

### Step 3: Install Django and Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install core packages
pip install Django djangorestframework django-cors-headers

# Install resume parsing libraries
pip install PyPDF2 python-docx

# Install spaCy for NLP
pip install spacy

# Download spaCy language model
python -m spacy download en_core_web_sm

# Install database adapter (optional for PostgreSQL)
pip install psycopg2-binary
```

### Step 4: Create Django Project

```bash
# Create project
django-admin startproject recruitment_project .

# Create candidates app
python manage.py startapp candidates

# Create utils folder
mkdir candidates/utils
touch candidates/utils/__init__.py  # macOS/Linux
type nul > candidates/utils/__init__.py  # Windows
```

### Step 5: Create Project Files

Create these files with the code from the artifacts:

```
backend/
├── candidates/
│   ├── utils/
│   │   ├── __init__.py
│   │   └── advanced_resume_parser.py  ← Copy from artifact
│   ├── __init__.py
│   ├── admin.py           ← Copy from artifact
│   ├── models.py          ← Copy from artifact
│   ├── serializers.py     ← Copy from artifact
│   ├── views.py           ← Copy from artifact
│   └── urls.py            ← Copy from artifact
├── recruitment_project/
│   ├── settings.py        ← Modify (see below)
│   └── urls.py            ← Modify (see below)
├── manage.py
└── requirements.txt       ← Create (see below)
```

### Step 6: Configure settings.py

Open `recruitment_project/settings.py` and make these changes:

```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party
    'rest_framework',
    'corsheaders',
    
    # Your apps
    'candidates',
]

# Add CORS middleware (BEFORE CommonMiddleware)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # ADD THIS
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Add at the BOTTOM of settings.py:

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Media Files (for resume uploads)
import os
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
}

# File Upload Settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760
```

### Step 7: Configure URLs

Edit `recruitment_project/urls.py`:

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/candidates/', include('candidates.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### Step 8: Create requirements.txt

```bash
pip freeze > requirements.txt
```

Or manually create `requirements.txt`:

```
Django>=4.2,<5.0
djangorestframework>=3.14.0
django-cors-headers>=4.0.0
PyPDF2>=3.0.0
python-docx>=0.8.11
spacy>=3.7.0
psycopg2-binary>=2.9.0
```

### Step 9: Run Migrations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create media directory
mkdir media
mkdir media/resumes
```

### Step 10: Create Superuser

```bash
python manage.py createsuperuser

# Enter:
# Username: admin
# Email: admin@example.com
# Password: (your password)
```

### Step 11: Test Backend

```bash
python manage.py runserver
```

**Should see:**
```
Starting development server at http://127.0.0.1:8000/
```

**Test in browser:**
- http://localhost:8000/admin/ (should load Django admin)

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
# Open NEW terminal (keep backend running)
cd ai-recruitment-system
cd frontend
```

### Step 2: Create React App with Vite

```bash
# Create Vite React project
npm create vite@latest . -- --template react

# When prompted:
# ✓ Select a variant: › JavaScript (not TypeScript)
# ✓ Use rolldown-vite? › No
```

### Step 3: Install Dependencies

```bash
# Install base dependencies
npm install

# Install axios for API calls
npm install axios
```

### Step 4: Create Folder Structure

```bash
# Create folders
mkdir src/components
mkdir src/services

# Create files (different commands for OS)

# Windows:
type nul > src/components/CandidateApplicationForm.jsx
type nul > src/components/CandidateApplicationForm.css
type nul > src/services/api.js
type nul > .env

# macOS/Linux:
touch src/components/CandidateApplicationForm.jsx
touch src/components/CandidateApplicationForm.css
touch src/services/api.js
touch .env
```

### Step 5: Copy Frontend Files

Copy code from artifacts into these files:

```
frontend/
├── src/
│   ├── components/
│   │   ├── CandidateApplicationForm.jsx  ← From artifact
│   │   └── CandidateApplicationForm.css  ← From artifact
│   ├── services/
│   │   └── api.js                        ← From artifact
│   ├── App.jsx                           ← Modify (see below)
│   └── main.jsx
├── .env                                  ← Create (see below)
└── package.json
```

### Step 6: Configure Environment

Create `.env` file:

```env
VITE_API_URL=http://localhost:8000/api
```

### Step 7: Update App.jsx

Replace content of `src/App.jsx`:

```jsx
import React from 'react';
import CandidateApplicationForm from './components/CandidateApplicationForm';
import './App.css';

function App() {
  return (
    <div className="App">
      <CandidateApplicationForm />
    </div>
  );
}

export default App;
```

### Step 8: Update App.css

Replace content of `src/App.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
    'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 
    'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.App {
  min-height: 100vh;
}
```

### Step 9: Test Frontend

```bash
npm run dev
```

**Should see:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

## Running the Application

### You Need TWO Terminals Running

**Terminal 1 - Backend:**
```bash
cd ai-recruitment-system/backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd ai-recruitment-system/frontend
npm run dev
```

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api/candidates/
- **Django Admin:** http://localhost:8000/admin/

---

## Testing

### Test 1: Complete Application Flow

1. Open http://localhost:5173
2. Fill form:
   - Name: John Doe
   - Email: john@test.com
   - Phone: +1-555-123-4567
   - Upload resume (use test resume below)
3. Click "Continue"
4. Review extracted data
5. Edit any fields
6. Click "Submit Application"
7. Should see success page with all data

### Test 2: Create Sample Resume

Create `test_resume.txt`:

```
JANE SMITH
Senior Full-Stack Developer

Contact:
Email: jane.smith@email.com
Phone: +1 (555) 987-6543
Location: San Francisco, CA
LinkedIn: linkedin.com/in/janesmith
GitHub: github.com/janesmith
Portfolio: https://janesmith.dev

PROFESSIONAL SUMMARY
Experienced software engineer with 8+ years building scalable web applications.
Expert in Python, React, and cloud technologies.

TECHNICAL SKILLS
Programming Languages: Python, JavaScript, TypeScript, Java, Go
Frontend: React, Vue, Angular, HTML, CSS, Tailwind
Backend: Django, Flask, Node.js, Express, FastAPI
Databases: PostgreSQL, MongoDB, Redis, MySQL
Cloud & DevOps: AWS, Docker, Kubernetes, Jenkins, Terraform
Tools: Git, GitHub, VS Code, Postman

PROFESSIONAL EXPERIENCE

Senior Software Engineer | Tech Innovations Inc.
January 2020 - Present | San Francisco, CA
- Lead team of 5 developers building microservices
- Implemented CI/CD pipeline reducing deployment time 60%
- Architected solutions serving 1M+ users
- Technologies: Python, React, AWS, Docker

Full-Stack Developer | Digital Solutions Corp.
June 2017 - December 2019 | San Francisco, CA
- Developed web applications using React and Django
- Built REST APIs handling 100K+ requests daily
- Implemented automated testing (90% coverage)
- Technologies: React, Django, PostgreSQL

Junior Developer | StartUp Labs
March 2016 - May 2017 | San Francisco, CA
- Frontend development with React
- Bug fixes and feature implementation

EDUCATION

Master of Science in Computer Science
Stanford University | 2014 - 2016
GPA: 3.9/4.0

Bachelor of Science in Software Engineering
UC Berkeley | 2010 - 2014
GPA: 3.7/4.0

CERTIFICATIONS
- AWS Certified Solutions Architect - Professional
- Google Cloud Professional Developer
- Certified Kubernetes Administrator (CKA)
- Certified Scrum Master (CSM)

PROJECTS

E-Commerce Platform
Built full-stack platform using React and Django
Features: Payment gateway, inventory management, admin dashboard
Technologies: React, Django, PostgreSQL, Redis, AWS
URL: https://github.com/janesmith/ecommerce

AI Chatbot
Intelligent chatbot using Python and NLP
Integrated with Slack and Microsoft Teams
Processes 50K+ daily conversations
Technologies: Python, NLP, TensorFlow, FastAPI
```

### Test 3: Verify in Django Admin

1. Go to http://localhost:8000/admin/
2. Login
3. Click "Candidates"
4. View submitted application
5. Check all parsed fields are populated

### Test 4: Test API Directly

```bash
# List all candidates
curl http://localhost:8000/api/candidates/

# Get specific candidate
curl http://localhost:8000/api/candidates/1/

# Test application endpoint
curl -X POST http://localhost:8000/api/candidates/apply/ \
  -F "full_name=Test User" \
  -F "email=test@example.com" \
  -F "phone=+1234567890" \
  -F "resume=@test_resume.txt"
```

---

## API Documentation

### Endpoints

#### 1. Apply for Position
```
POST /api/candidates/apply/
Content-Type: multipart/form-data

Required Fields:
- full_name (string)
- email (string)
- resume (file: PDF/DOCX/TXT, max 10MB)

Optional Fields:
- phone (string)

Response: 201 Created
{
  "message": "Application submitted successfully!",
  "candidate": { ... full candidate data ... },
  "is_update": false
}
```

#### 2. List All Candidates
```
GET /api/candidates/
Optional Query Params:
- status (string): Filter by application_status

Response: 200 OK
[
  {
    "id": 1,
    "full_name": "Jane Smith",
    "email": "jane@example.com",
    ...
  }
]
```

#### 3. Get Candidate Details
```
GET /api/candidates/{id}/

Response: 200 OK
{
  "id": 1,
  "full_name": "Jane Smith",
  "parsed_skills": ["Python", "React", ...],
  "parsed_experience": [...],
  ...
}
```

#### 4. Update Candidate
```
PATCH /api/candidates/{id}/update/
Content-Type: application/json

Body: {
  "parsed_skills": ["Python", "JavaScript", "React"],
  "parsed_location": "San Francisco, CA",
  ...
}

Response: 200 OK
{ ... updated candidate data ... }
```

#### 5. Delete Candidate
```
DELETE /api/candidates/{id}/delete/

Response: 204 No Content
```

---

## Troubleshooting

### Issue 1: Port Already in Use

**Error:** `Port 8000 is already in use`

**Fix:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9

# Or use different port
python manage.py runserver 8001
```

### Issue 2: CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS`

**Fix:**
1. Check `django-cors-headers` installed: `pip show django-cors-headers`
2. Verify `corsheaders` in `INSTALLED_APPS`
3. Verify `CorsMiddleware` in `MIDDLEWARE`
4. Check `CORS_ALLOWED_ORIGINS` includes frontend URL
5. Restart Django server

### Issue 3: spaCy Model Not Found

**Error:** `Can't find model 'en_core_web_sm'`

**Fix:**
```bash
python -m spacy download en_core_web_sm

# If download fails:
pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.0/en_core_web_sm-3.7.0-py3-none-any.whl
```

### Issue 4: Module Not Found

**Error:** `ModuleNotFoundError: No module named 'rest_framework'`

**Fix:**
```bash
# Make sure virtual environment is activated
# You should see (venv) in prompt

# Reinstall
pip install -r requirements.txt
```

### Issue 5: Migration Errors

**Error:** Migration conflicts

**Fix:**
```bash
# Delete migrations (keep __init__.py)
rm candidates/migrations/0*.py

# Delete database
rm db.sqlite3

# Recreate
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### Issue 6: Resume Parsing Fails

**Error:** Parsing status shows "failed"

**Check:**
```bash
# Test spaCy
python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('OK')"

# Test file reading
python -c "import PyPDF2; print('OK')"
python -c "import docx; print('OK')"

# Check Django logs in terminal
```

---

## Project Structure

```
ai-recruitment-system/
│
├── backend/
│   ├── candidates/
│   │   ├── migrations/
│   │   │   ├── __init__.py
│   │   │   └── 0001_initial.py
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   └── advanced_resume_parser.py
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── media/
│   │   └── resumes/
│   ├── recruitment_project/
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── venv/
│   ├── db.sqlite3
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CandidateApplicationForm.jsx
│   │   │   └── CandidateApplicationForm.css
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
└── test_resume.txt
```

---

## Quick Start Commands Reference

### Daily Development

**Start Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate
python manage.py runserver
```

**Start Frontend:**
```bash
cd frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- API: http://localhost:8000/api/candidates/
- Admin: http://localhost:8000/admin/

### Useful Django Commands

```bash
# Create new migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Open Django shell
python manage.py shell

# Collect static files
python manage.py collectstatic

# Run tests
python manage.py test
```

### Useful Database Commands

```bash
# Django shell
python manage.py shell
```

```python
# List all candidates
from candidates.models import Candidate
Candidate.objects.all()

# Get specific candidate
c = Candidate.objects.get(id=1)
print(c.parsed_skills)

# Update candidate
c.parsed_skills = ['Python', 'JavaScript']
c.save()

# Delete all candidates
Candidate.objects.all().delete()
```

---

## Features Summary

### ✅ Module 1 Complete Features

1. **Candidate Application Form**
   - Personal details input
   - Resume file upload (PDF/DOCX/TXT)
   - File validation

2. **Advanced Resume Parsing**
   - Name extraction
   - Contact info (email, phone, location)
   - Professional links (LinkedIn, GitHub, Portfolio)
   - Skills categorization (Languages, Frameworks, Tools)
   - Work experience with details
   - Education history
   - Certifications
   - Projects
   - Professional summary
   - Experience calculation

3. **Review & Edit Workflow**
   - 3-step process (Upload → Review → Submit)
   - Candidate verifies extracted data
   - Edit any incorrect information
   - Final submission confirmation

4. **Update Capability**
   - Candidates can reapply with same email
   - Updates existing record (no duplicates)
   - Resume re-parsing on new upload

5. **Admin Dashboard**
   - View all applications
   - Filter by status
   - Edit candidate data
   - View parsing details

---

## Next Steps (Future Modules)

### Module 2: Enhanced NLP Parsing
- Custom NER models
- Better accuracy
- Multi-language support

### Module 3: Semantic Matching
- Job description analysis
- Candidate-job matching scores
- AI-powered ranking

### Module 4: HR Chatbot
- 24/7 candidate support
- FAQ handling
- Application status queries

### Module 5: Video Interview Analysis
- Facial expression analysis
- Voice tone detection
- Behavioral scoring

---

## Support & Contact

**Issues?**
1. Check [Troubleshooting](#troubleshooting) section
2. Check Django terminal for errors
3. Check browser console (F12) for frontend errors
4. Review [API Documentation](#api-documentation)

**Project Status:**
- ✅ Module 1: Complete
- ⏳ Module 2-8: Coming soon

---

## License

This project is for educational purposes (FYP).

---

**Built with ❤️ for AI-Powered Recruitment**

Last Updated: January 2026