# FINWISE 🧠✨
### AI-Powered Financial Strategist

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-f44336?style=for-the-badge&logo=langchain&logoColor=white)

---

## 👥 Our Team

* **M.Jagadeeswar Reddy** - 23BDS033
* **J.Ganesh Kumar Reddy** - 23BDS024
* **B. Varshith** - 23BDS011
* **B.Harsha vardhan** - 23BDS015
* **C.Sai Aravind** - 23BDS075

---

## 📖 About The Project

FinWise is not just another budgeting app. It's an intelligent financial co-pilot designed to provide personalized, actionable, and holistic financial advice. It moves beyond simple transaction tracking to answer complex, context-aware questions like, *"Based on my current spending and savings, can I afford a ₹50,000 vacation in 6 months?"*

The core of FinWise is a sophisticated **multi-agent AI system**. Instead of a single, monolithic AI, FinWise uses a team of specialist agents (for budgeting, investing, debt, etc.), all coordinated by a "Master Strategist" agent. This allows FinWise to break down complex financial questions, delegate tasks to the right expert, and then synthesize the results into a single, comprehensive, and actionable plan for the user.

### ✨ Core Features

* **AI-Powered Dashboard:** A central "Strategist's Desk" that visualizes key financial vitals like cash flow, savings rate, and goal progress, all driven by live data.
* **Actionable Insights:** AI-generated cards that highlight risks and opportunities (e.g., "High spending in 'Dining Out'", "Opportunity to optimize debt").
* **Interactive Insight Details:** Each insight card is clickable, opening a detailed modal with the full AI analysis (e.g., "🎯 **YOUR COMPREHENSIVE FINANCIAL PLAN**") rendered in Markdown.
* **Interactive AI Command Bar:** A chat-like interface where users can ask complex financial questions and receive detailed, multi-step answers.
* **What-If Scenarios:** A dedicated page to test the financial impact of major life decisions, like buying a new car or getting a salary increase.
* **Dedicated Insight & Goal Tracking:** A full "All Insights" page to review AI-generated history and pages to track your financial goals and portfolio.
* **Live Agent Visualization:** A sidebar widget (`AgentWorkflowVisualizer`) that shows the AI agent network in real-time as they "think" and collaborate to answer a user's query.
* **Secure Authentication:** A robust auth system using Node.js, Passport.js, and httpOnly JWT cookies for maximum security.

---

## 🏗️ Project Architecture

FinWise follows a **modular 3-tier architecture** that ensures scalability, maintainability, and security.  
Each layer — **Frontend**, **Backend**, and **AI Core** — is independently deployable and communicates through secure APIs.

```text
┌───────────────────────────┐      ┌───────────────────────────┐      ┌────────────────────────────┐
│      Frontend Client      │      │       Backend Server      │      │         AI Core API        │
│   (React + TypeScript)    │      │   (Node.js + Express)     │      │ (Python + FastAPI/LangGraph)│
│   (Vite @ localhost:5173) │      │  (Express @ localhost:3000)│     │   (FastAPI @ localhost:8001)│
└────────────┬──────────────┘      └────────────┬──────────────┘      └────────────┬───────────────┘
             │                                   │                                 │
             │  <─── UI / State Sync ───>        │                                 │
             │  <─── API Calls (React Query) ───>│                                 │
             │          (e.g. /api/agent-outputs/user/:id)                         │
             │                                   │ <── Auth / DB Ops ───> [MongoDB]│
             │                                   │ <── AI Request (user_profile) ─>│
             │  <── Structured JSON ─────────────│ <── AI Plan + Metadata ─────────│
             │  <── Final Response (Serves JSON Data) ─────────────────────────────│
```

### 1. Frontend (Client)

The user interface is a fast, modern single-page application (SPA) built for a seamless user experience.

* **Stack:** **React**, **Vite**, **TypeScript**, **Tailwind CSS**
* **Data Fetching:** **React Query (TanStack Query)** is used for all server state management. It handles caching, refetching, and mutations, providing a snappy UI that feels instantaneous.
* **Routing:** **Wouter** provides a minimal and hooks-based routing solution to manage all pages (`/dashboard`, `/portfolio`, `/all-insights`, etc.).
* **UI & UX:** **shadcn/ui** provides the base component library (Cards, Buttons, Modals), which is then customized and animated using **Framer Motion**.
* **State Management:** A combination of React Query for server state and simple React Context (`useAuth`) for global client state (like the logged-in user).

### 2. Backend (Server)

The backend server acts as the central hub, managing user data, authentication, and communication with the AI.

* **Stack:** **Node.js**, **Express**, **TypeScript**
* **Database:** **MongoDB** with **Mongoose** for flexible document-based storage of:
    * `userModel`: Stores user credentials and profile info.
    * `financialProfileModel`: A rich document containing all user transactions, goals, debts, and income.
    * `agentOutputModel`: Stores the structured JSON output from every AI interaction, allowing us to build an insight history.
* **Authentication:** **Passport.js** with a JWT (JSON Web Token) strategy. It securely issues **httpOnly cookies** to the client, which are automatically and securely included in all subsequent API requests.
* **Role:** It serves all financial profile data to the client, validates user input, and acts as a **secure gateway** to the Python AI service. It constructs the full `user_profile` object and forwards it to the AI Core, ensuring the client never interacts with the AI directly.

### 3. AI Core (Python Microservice)

This is the "brain" of the operation. It's a separate microservice (`api_service.py`) dedicated entirely to AI processing, ensuring that complex computations don't block the main backend.

* **Stack:** **Python**, **FastAPI**, **LangGraph**
* **API:** **FastAPI** provides a high-performance, asynchronous API layer that receives the `user_input` and `user_profile` from the Node.js backend.
* **Orchestration:** **LangGraph** (from LangChain) is the star of the show. We define a *stateful graph* (`workflow.py`) that acts as a router. It intelligently routes the user's query to the correct agent or a chain of agents based on the query's intent.
* **The Agent Team:** We built a team of specialized agents, each powered by **Google Gemini** and a unique system prompt, turning a general-purpose LLM into a domain expert:
    * `MasterFinancialStrategistAgent`: The orchestrator. It analyzes the user's initial query and decides which specialist(s) to call. It is also responsible for synthesizing the final, comprehensive plan from all the specialist reports.
    * `IncomeExpenseAnalyzerAgent`: Analyzes transaction history to find spending patterns and calculate metrics like savings rate.
    * `BudgetPlannerAgent`: Creates and optimizes 50/30/20 budgets and savings plans.
    * `InvestmentAdvisorAgent`: Provides portfolio recommendations (stocks, bonds, etc.) based on the user's risk tolerance.
    * `DebtOptimizerAgent`: Creates strategic debt payoff plans (e.g., Snowball vs. Avalanche).
    * `FinancialEducatorAgent`: Answers general-knowledge financial questions (e.g., "What is inflation?").

This multi-agent architecture allows FinWise to provide incredibly detailed and specialized advice, as each agent focuses only on its area of expertise. The final `outputData` is a rich JSON object containing the full text response, a title, a description, and actionable metadata (like `actionType` and `priority`) that the frontend uses to build the interactive UI.

---

## 📁 Project Folder Structure

```bash
FINWISE/
├── client/ (React + TypeScript frontend)
└──  server/ (Node.js backend + AI Core microservice)
       ├──AI_Core/ (Python FastAPI + LangGraph agents)
       └── src/(node.js Backend) 
```

---

## 🚀 Getting Started

Follow these instructions to get the complete project running locally. You will need **three separate terminal windows** open simultaneously.

### Prerequisites

* Node.js (v18 or later)
* npm
* Python (v3.10 or later)
* pip
* MongoDB (local or Atlas)

### 1️⃣ Backend (Node.js Server)
```bash
cd FINWISE/server
npm install
npm run dev
```

### 2️⃣ AI Core (Python Microservice)
```bash
cd FINWISE/server/AI_Core
pip install -r requirements.txt
uvicorn api_service:app --reload --port 8001
```

### 3️⃣ Frontend (React Client)
```bash
cd FINWISE/client
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚀 Demo Working App

🎥 **Live Demo:**  
👉 [Click here to view the working demo on Google Drive](https://drive.google.com/file/d/1WbJZd8Rap14gfbpK36pMV1a2FX-mi8dy/view?usp=drive_link)  
_This demo shows the full working flow of FinWise, including data input, AI analysis, and final financial recommendations powered by multi-agent intelligence._

---

**FinWise** — *Empowering smarter financial decisions through multi-agent intelligence* 💡
