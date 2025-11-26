# GreenQuest Prototype (local)

This is a minimal Vite + React project to run the `GreenQuestPrototypeComplete` component (client-only demo). It includes Tailwind setup so styling matches the component.

Run (PowerShell):

```powershell
Set-Location .\greenquest
npm install
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`).

Admin password: `greenquest-admin`

Notes:
- File uploads are read as data URLs and stored in `localStorage` (no backend required).
- To remove demo data use the `Reset demo` button in the UI or clear browser `localStorage`.
