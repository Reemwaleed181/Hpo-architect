# HPO Architect

Interactive web application to design hyperparameter optimization experiments.

Run locally:

```bash
npm install
npm run dev
```

This project is a frontend-only React + TypeScript app using Vite and Tailwind CSS. It stores experiments in `localStorage` and provides recommendations using a rule-based engine in `src/lib/hpo-engine.ts`.
