# FINWISE 🧠✨
###  AI-Powered Financial Strategist

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
* **C.Sai Aravind** - 23BDS074

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
```text

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

This structure includes all components, pages, services, controllers, models, and AI agents.

```bash
FINWISE/
├── .gitignore
├── README.md
│
├── client/
│   ├── .env.example
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── README.md
│   ├── tailwind.config.js
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── node_modules/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── ui/
│       │   │   └── (shadcn components: Button.tsx, Card.tsx, Dialog.tsx, etc.)
│       │   ├── Actionableinsights.tsx
│       │   ├── AgentWorkflowVisualizer.tsx
│       │   ├── AICommandBar.tsx
│       │   ├── FinancialVitals.tsx
│       │   ├── GoalProgress.tsx
│       │   ├── InsightDetailModal.tsx  
│       │   ├── InvestmentPortfolio.tsx
│       │   ├── ScenarioWidget.tsx
│       │   ├── Sidebar.tsx
│       │   ├── SpendingAnalysis.tsx
│       │   └── ThemeProvider.tsx
│       ├── hooks/
│       │   ├── useAuth.tsx
│       │   └── useToast.tsx
│       ├── lib/
│       │   ├── apiClient.ts
│       │   ├── queryClient.ts
│       │   └── utils.ts
│       ├── pages/
│       │   ├── AllInsights.tsx      
│       │   ├── Dashboard.tsx
│       │   ├── FinancialStory.tsx
│       │   ├── Login.tsx
│       │   ├── NotFound.tsx
│       │   ├── Portfolio.tsx
│       │   ├── Register.tsx
│       │   ├── Scenarios.tsx
│       │   ├── UserProfile.tsx
│       │   └── VerifyEmail.tsx
│       ├── types/
│       │   └── index.ts
│       ├── App.css
│       ├── App.tsx
│       ├── index.css
│       └── main.tsx
│
└── server/
    ├── .env
    ├── .gitignore
    ├── package-lock.json
    ├── package.json
    ├── README.md
    ├── tsconfig.json
    ├── node_modules/
    │
    ├── AI_Core/
    │   ├── .env
    │   ├── finwise.log
    │   ├── main.py
    │   ├── api_service.py
    │   ├── README.md
    │   ├── requirements.txt
    │   ├── agents/
    │   │   ├── __init__.py
    │   │   ├── __pycache__/
    │   │   ├── budget_planner.py
    │   │   ├── debt_optimizer.py
    │   │   ├── financial_educator.py
    │   │   ├── income_expense_analyzer.py
    │   │   ├── investment_advisor.py
    │   │   └── master_agent.py
    │   ├── config/
    │   │   ├── __init__.py
    │   │   ├── __pycache__/
    │   │   └── settings.py
    │   ├── graph/
    │   │   ├── __init__.py
    │   │   ├── __pycache__/
    │   │   ├── state.py
    │   │   └── workflow.py
    │   ├── tools/
    │   │   ├── __init__.py
    │   │   ├── __pycache__/
    │   │   ├── data_processors.py
    │   │   └── financial_calculators.py
    │   └── utils/
    │       ├── __init__.py
    │       ├── __pycache__/
    │       └── helpers.py
    │
    └── src/
        ├── config/
        │   ├── databases.ts
        │   └── passports.ts
        ├── controllers/
        │   ├── authController.ts
        │   └── aiController.ts
        ├── models/
        │   ├── agentOutputModel.ts
        │   ├── financialProfileModel.ts
        │   └── userModel.ts
        ├── routes/
        │   ├── authRoutes.ts
        │   └── aiRoutes.ts
        └── utils/
            ├── sendEmail.ts
            └── server.ts

## 📸 Screenshots

*(Here you should add 3-4 screenshots of your application)*

****
*The main Strategist's Desk, showing Financial Vitals and the Actionable Insights component.*

****
*A user asking a complex question and the AI's response rendering in the expandable modal.*

****
*Showing the full "🎯 YOUR COMPREHENSIVE FINANCIAL PLAN" after clicking an insight card.*

****
*The dedicated page listing all historical insights, which can be clicked to open the detail modal.*

---

## 🚀 Getting Started

Follow these instructions to get the complete project running locally. You will need **three separate terminal windows** open simultaneously.

### Prerequisites

* Node.js (v18 or later)
* npm
* Python (v3.10 or later)
* pip
* MongoDB (A local instance or a free Atlas cluster URL)

### 1. Backend (Node.js Server)

This server runs on `http://localhost:3000`.

```bash
# 1. Navigate to the server directory
cd FINWISE/server

# 2. Install dependencies
npm install

# 3. Create a .env file in the /server directory
touch .env

# 4. Add your environment variables to .env
#    (You can copy from .env.example if one exists)
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
PYTHON_API_URL=http://localhost:8001
EMAIL_USER=your_gmail_for_nodemailer@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM="FinWise <your_gmail_for_nodemailer@gmail.com>"
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# 5. Run the server
npm run dev

2. AI Core (Python Microservice)
This server runs on http://localhost:8001.

Bash

# 1. In a NEW terminal, navigate to the AI_Core directory
cd FINWISE/server/AI_Core

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Create a .env file in the /AI_Core directory
touch .env

# 4. Add your Google Gemini API key
GEMINI_API_KEY=your_google_gemini_api_key

# 5. Run the FastAPI server with uvicorn
uvicorn api_service:app --reload --port 8001
3. Frontend (React Client)
This server runs on http://localhost:5173.

Bash

# 1. In a THIRD terminal, navigate to the client directory
cd FINWISE/client

# 2. Install dependencies
npm install

# 3. Run the frontend development server
#    (It's already configured to proxy /api requests to localhost:3000)
npm run dev
You can now open http://localhost:5173 in your browser to use the application!
