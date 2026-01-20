# 🚀 AI-Powered Recruitment System

A comprehensive, full-stack recruitment platform that leverages Artificial Intelligence to streamline the hiring process. This system automates candidate ranking, resume parsing, and provides intelligent matching between job descriptions and candidate profiles.

## ✨ Key Features

- **🤖 AI Matching Engine**: Automatically calculates compatibility scores (0-100%) between candidates and jobs based on Skills, Experience, Education, Location, and Semantic relevance.
- **📄 Resume Parsing**: NLP-powered extraction of candidate data from resumes (PDF, DOCX).
- **📊 HR Dashboard**: Interactive dashboard for recruiters to view top candidates, match breakdowns, and manage job postings.
- **👨‍💻 Candidate Portal**: User-friendly interface for candidates to browse jobs, apply, and track their application status.
- **🔍 Advanced Search & Filtering**: Filter candidates by match score, skills, and more.
- **📈 Detailed Analytics**: Visual breakdown of match scores (Strengths, Weaknesses, Recommendations).

## 🛠️ Tech Stack

### Backend
- **Framework**: Django & Django REST Framework (DRF)
- **Language**: Python
- **Database**: SQLite (Development) / PostgreSQL (Production ready)
- **AI/ML**: 
  - `spaCy` (NLP & Semantic Similarity)
  - `scikit-learn` (Vectorization)
  - `numpy` (Numerical operations)

### Frontend
- **Framework**: React (Vite)
- **Styling**: CSS (Modular & Responsive)
- **HTTP Client**: Axios
- **Linting**: ESLint

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Python** (v3.8 or higher)
- **Node.js** (v14 or higher) & **npm**
- **Git**

---

## 🚀 Quick/Complete Setup Guide

Follow these instructions to set up the project locally.

### 1️⃣ Backend Setup (Django)

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment:**
    - Windows:
      ```bash
      python -m venv venv
      ```
    - macOS/Linux:
      ```bash
      python3 -m venv venv
      ```

3.  **Activate the virtual environment:**
    - Windows:
      ```bash
      venv\Scripts\activate
      ```
    - macOS/Linux:
      ```bash
      source venv/bin/activate
      ```

4.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Download the spaCy NLP model:**
    *This is required for the semantic matching engine.*
    ```bash
    python -m spacy download en_core_web_sm
    ```

6.  **Apply database migrations:**
    ```bash
    python manage.py migrate
    ```

7.  **Start the Backend Server:**
    ```bash
    python manage.py runserver
    ```
    *The backend will run at `http://localhost:8000`*

### 2️⃣ Frontend Setup (React)

Open a **new terminal** window (do not close the backend terminal).

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install Node dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Frontend Development Server:**
    ```bash
    npm run dev
    ```
    *The frontend will typically run at `http://localhost:5173`*

---

## 🧪 Testing the System

1.  **Access the Application**: Open your browser and go to `http://localhost:5173`.
2.  **HR Dashboard**: Navigate to the dashboard to post jobs and view applicants.
3.  **Candidate Application**: Application forms will automatically parse uploaded resumes and trigger the AI matching engine.

## 📁 Project Structure

```
ai-recruitment-system/
├── backend/                # Django Backend
│   ├── jobs/               # Job Posting & Matching Logic
│   ├── candidates/         # Candidate Management
│   ├── recruitment_project/# Project Configuration
│   ├── media/              # Uploaded Resumes
│   └── manage.py
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # React Components (Jobs, Auth, etc.)
│   │   └── App.jsx
│   └── package.json
├── README.md               # Project Documentation
└── SETUP.md                # Detailed Setup Guide
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request