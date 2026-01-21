# Developer Guide

[**⬅ Back: Database Schema**](./DATABASE_SCHEMA.md) | [**Next: API Guide ➔**](./API_GUIDE.md)

## Setup
1.  **Clone the repository**.
2.  **Install dependencies**: `npm install`.
3.  **Environment Variables**: Create a `.env` file from `.env.example`.
    -   Ensure `GEMINI_API_KEY` is valid.
    -   Configure `XENDIT_SECRET_KEY` for payments.
4.  **Local AI (Optional)**: Install [Ollama](https://ollama.ai/) and run `ollama run qwen2.5:7b`.

## Development Commands
-   `npm run dev:full`: Starts both the Vite frontend and Express backend.
-   `npm run server`: Starts only the Express backend.
-   `npm run seed.ts`: Populates the database with sample users, posts, and transactions.

## Adding Features
-   **Database**: Add schema changes to `config/database.ts` and update `DATABASE_SCHEMA.md`.
-   **AI**: Modify `services/geminiService.ts` for new prompts or model updates.
-   **Support**: Improvements to the help desk should be made in `components/SupportDashboard.tsx`.

## Key Files
-   `server.js`: Express routes and middleware.
-   `App.tsx`: Routing and main application state.
-   `services/databaseService.ts`: SQLite implementations.
-   `services/universalDatabaseService.ts`: Environment-agnostic database wrapper.
