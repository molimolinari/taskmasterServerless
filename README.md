# TaskMaster

TaskMaster is a serverless web application for managing tasks, built with a React frontend and a Python AWS Lambda backend. It supports file uploads, voice messages, and email notifications.

## Project Structure

- `frontend/`: React app (Vite, JSX, CSS)
- `backend/`: Python Lambda functions, AWS SAM templates

## Developer Workflows

### Frontend
- Install dependencies: `npm install` in `frontend/`
- Start dev server: `npm run dev`
- Build: `npm run build`
- Output: `frontend/dist/`

### Backend
- Use AWS SAM CLI for local development, build, and deployment:
  - Build: `sam build`
  - Local invoke: `sam local invoke` or `sam local start-api`
  - Deploy: `sam deploy --guided`
- Python dependencies are managed per Lambda function.

## Deployment
- The frontend build (`frontend/dist/`) is deployed to the S3 bucket `taskmaster-acrylar`.
- Backend is deployed using AWS SAM.

## Github Actions
- On every push to `main`, the frontend build is copied to the S3 bucket automatically (see `.github/workflows/deploy-frontend.yml`).

## Environment Variables
- Frontend: `frontend/.env` (not committed)
- Backend: Set via AWS Lambda environment variables or `template.yaml`.

## Key Features
- Task creation with due date (min 2 days ahead)
- Multiple file uploads per task
- Voice message recording and upload
- Email notifications with all files/audio attached
- Mark tasks as completed or canceled

---

*For more details, see the code and `.github/copilot-instructions.md`.*
