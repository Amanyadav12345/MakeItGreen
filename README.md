# 🚀 CrewCore

**CrewCore** is a smart workforce and project management dashboard that enables team allocation, worker tracking, and AI-powered optimization for better project execution. Built with Node.js and Gemini AI.

---

## ✨ Features

- 🧑‍💼 Add and manage multiple projects with priority levels
- 👷‍♂️ Assign workers to specific projects
- 🟧 Mark workers as "extras" to use them flexibly
- 📊 View worker distribution with interactive charts
- 🧠 Get AI-based suggestions for team optimization using Google Gemini
- 💬 Chat with an AI assistant to request reallocation or get workforce advice

---

## 🖥️ Demo UI Overview

| Section              | Description                                               |
|----------------------|-----------------------------------------------------------|
| Project Creation     | Add a new project with a name and priority level          |
| Worker Assignment    | Add workers to a project, with optional "extra" status    |
| Dashboard Charts     | Bar chart of workers per project                          |
| AI Recommendation    | One-click AI optimization suggestions                     |
| AI Chat Assistant    | Ask the AI for team reallocations based on needs          |

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: HTML, CSS, Vanilla JS
- **AI Integration**: Google Gemini (Generative AI)
- **Charting**: Chart.js

---

## 🔧 Installation & Setup

```bash
git clone https://github.com/yourusername/crewcore.git
cd crewcore
npm install

```
##ADD your own api key
GEMINI_API_KEY=your-google-gemini-api-key
##to start server
node server.js



#  Setup Node.js frontend
npm install
node server.js

#  Setup FastAPI backend
cd backend_ppe
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000