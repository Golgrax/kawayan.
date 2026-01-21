# System Manual (Technical Operations)

[**⬅ Back: User Guide**](./USER_GUIDE.md) | [**Next: Architecture ➔**](./ARCHITECTURE.md)

## 1. System Initialization
The system initializes its schema automatically on startup via `config/database.ts`. If you need to wipe and reset, use `npm run seed.sh` (this will delete `kawayan.db`).

## 2. Auditing Mechanism
Every major administrative or user action is logged into the `audit_logs` table. This includes:
-   Logins/Logouts
-   Wallet adjustments
-   Post generations
-   Support ticket status changes

Logs can be exported or viewed directly in the **Administrator Panel**.

## 3. Support Protocol
Agents should use the **Support Dashboard**:
1.  Check **Overview** for critical tickets.
2.  Open **Tickets** tab to engage with users.
3.  Use **User Context** sidebar to verify identity and wallet balance before providing billing support.
4.  Switch to **Call Center** for real-time WebRTC support sessions.

## 4. AI Engine Priority
1.  `gemini-flash-latest` (Fastest cloud option).
2.  `gemini-2.0-flash` (Stable cloud option).
3.  `Ollama / qwen2.5:7b` (Local fallback - no quota limits).

## 5. Troubleshooting
-   **AI Not Responding**: Check `.env` for API Key or ensure Ollama is running (`curl 127.0.0.1:11434`).
-   **Database Locked**: Ensure only one process is accessing `kawayan.db` or use WAL mode (already enabled).
-   **Payment Not Syncing**: Check Xendit webhook configuration or use the manual "Refresh" button in the Support Dashboard.
