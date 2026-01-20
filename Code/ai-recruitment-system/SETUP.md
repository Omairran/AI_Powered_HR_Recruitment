# 🛠️ AI Recruitment System - Detailed Setup Guide

This document provides a step-by-step guide to setting up the AI Recruitment System development environment on your local machine.

## 📋 Prerequisites

Ensure you have the following software installed:

1.  **Python 3.8+**: [Download Python](https://www.python.org/downloads/)
    *   Verify installation: `python --version`
2.  **Node.js 14+ & npm**: [Download Node.js](https://nodejs.org/)
    *   Verify installation: `node --version` && `npm --version`
3.  **Git**: [Download Git](https://git-scm.com/)

---

## 🔧 Backend Setup (Django)

The backend handles the database, API, and AI processing logic.

### 1. Environment Setup

Open your terminal (Command Prompt, PowerShell, or Terminal) and navigate to the project's `backend` folder:

```bash
cd path/to/ai-recruitment-system/backend
```

Create a virtual environment to isolate dependencies:

**Windows:**
```bash
python -m venv venv
```

**macOS / Linux:**
```bash
python3 -m venv venv
```

### 2. Activate Virtual Environment

You must activate the environment every time you work on the backend.

**Windows:**
```bash
venv\Scripts\activate
```

**macOS / Linux:**
```bash
source venv/bin/activate
```

*(You should see `(venv)` appear at the start of your terminal line)*

### 3. Install Dependencies

Install all required Python packages from the `requirements.txt` file:

```bash
pip install -r requirements.txt
```

### 4. Install AI Models

The system uses `spaCy` for Natural Language Processing. You must download the English language model:

```bash
python -m spacy download en_core_web_sm
```

### 5. Database Setup

Apply the database migrations to set up the SQLite database schema:

```bash
python manage.py migrate
```

*(Optional) Create a superuser to access the Django Admin interface:*

```bash
python manage.py createsuperuser
```

### 6. Run the Server

Start the Django development server:

```bash
python manage.py runserver
```

The API is now running at: `http://localhost:8000`

---

## 🎨 Frontend Setup (React)

The frontend provides the user interface for Candidates and HR managers.

### 1. Install Dependencies

Open a **new** terminal window (keep the backend running in the first one). Navigate to the `frontend` folder:

```bash
cd path/to/ai-recruitment-system/frontend
```

Install the Node.js packages:

```bash
npm install
```

### 2. Environment Configuration

Ensure the `.env` file exists in the `frontend` directory with the correct API URL:

```env
VITE_API_URL=http://localhost:8000/api
```

### 3. Run the Application

Start the Vite development server:

```bash
npm run dev
```

The application is now accessible at: `http://localhost:5173` (or the URL shown in your terminal).

---

## 🐛 Troubleshooting

### Common Issues

**1. "Module not found: spacy"**
*   **Solution**: Ensure you activated your virtual environment (`venv\Scripts\activate`) before running the server or installing requirements.

**2. "OSError: [E050] Can't find model 'en_core_web_sm'"**
*   **Solution**: You forgot to download the model. Run: `python -m spacy download en_core_web_sm`

**3. Frontend cannot connect to Backend**
*   **Solution**: Ensure the Django backend is running on port 8000. Check the Network tab in your browser's developer tools for CORS errors.

**4. pip install fails**
*   **Solution**: Upgrade pip (`python -m pip install --upgrade pip`) and try again. For Windows, you may need C++ Build Tools if compiling certain packages fails.

---

## 📚 API Documentation

Once the backend is running, you can explore the API endpoints if Swagger/Redoc is configured, or simply browse:
- Admin Panel: `http://localhost:8000/admin`
- API Root: `http://localhost:8000/api/`
