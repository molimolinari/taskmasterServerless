# Copilot Instructions for TaskMaster

## Project Overview
TaskMaster is a serverless web application with a React frontend and a Python AWS Lambda backend. The backend is managed with AWS SAM, and the frontend uses Vite for development and build. The project is organized into two main folders:

- `frontend/`: React app (Vite, JSX, CSS)
- `backend/`: Python Lambda functions, AWS SAM templates

## Architecture & Data Flow
- **Frontend** (`frontend/`):
  - Entry: `src/main.jsx`, main UI in `src/App.jsx`.
  - Communicates with backend via HTTP (likely REST endpoints exposed by AWS Lambda/APIGateway).
  - Static assets in `public/`.
- **Backend** (`backend/`):
  - Lambda functions in `src/` (e.g., `create_task.py`, `list_tasks.py`).
  - `template.yaml` defines AWS resources and function mappings.
  - `aws-sam-cli-macos-arm64.pkg` is for local AWS SAM CLI installation.

## Developer Workflows
- **Backend**:
  - Use AWS SAM CLI for local development, build, and deployment:
    - Build: `sam build`
    - Local invoke: `sam local invoke` or `sam local start-api`
    - Deploy: `sam deploy --guided`
  - Python dependencies are managed per Lambda function (no monolithic requirements.txt).
- **Frontend**:
  - Install deps: `npm install` in `frontend/`
  - Start dev server: `npm run dev`
  - Build: `npm run build`

## Project-Specific Patterns
- Each Lambda function is a separate Python file in `backend/src/`.
- API endpoints and event sources are defined in `backend/template.yaml`.
- No monorepo-level package management; treat frontend and backend as separate projects.
- Environment variables for frontend go in `frontend/.env` (not committed).

## Integration Points
- Frontend calls backend endpoints (URLs may be set in `.env` or hardcoded in frontend code).
- Backend functions may send emails (`send_task_email.py`) or generate upload URLs (`get_upload_url.py`).

## Key Files
- `backend/template.yaml`: AWS resources and Lambda wiring
- `frontend/src/App.jsx`: Main React component
- `frontend/vite.config.js`: Vite config

## Conventions
- Keep backend Lambda functions small and focused (one file = one function)
- Use clear, descriptive function and file names
- Document new endpoints in `template.yaml` and frontend API calls

---

*Update this file if you add new major workflows, integration points, or conventions.*
